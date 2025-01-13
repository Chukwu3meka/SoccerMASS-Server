import validate from "../../../utils/validate";

import { ObjectId } from "mongodb";
import { isValidObjectId } from "mongoose";
import { Request, Response } from "express";
import { APIHUB_ENDPOINTS } from "../../../models/apihub.model";
import { HTTP_METHODS } from "../../../utils/constants";
import { composeHandler, endpointTitleExistsFn } from "..";
import { catchError, requestHasBody, textToId } from "../../../utils/handlers";

export default async (req: Request, res: Response) => {
  try {
    requestHasBody({ body: req.body, required: ["id", "category", "title", "description", "path", "method", "snippets"], sendError: true });

    const { id, category, title, description, path, method, snippets: tempSnippets } = req.body;

    validate({ value: id, type: "comment", sendError: true, label: "ID" });
    validate({ value: title, type: "comment", sendError: true, label: "Title" });
    validate({ value: path, type: "comment", sendError: true, label: "API Path" });
    validate({ value: category, type: "comment", sendError: true, label: "Category" });
    validate({ value: method, type: "alphaNumeric", sendError: true, label: "Method" });
    validate({ value: description, type: "comment", sendError: true, label: "Description" });

    if (!Array.isArray(tempSnippets)) throw { sendError: true, message: "Snippet is not an array" };
    if (!HTTP_METHODS.includes(method)) throw { sendError: true, message: "Method not allowed", type: "method" };

    const snippets = tempSnippets.filter((snippet) => Boolean(snippet.code));
    if (snippets.length <= 3) throw { sendError: true, message: "Add at least Three Snippets to proceed" };

    for (const data of snippets.filter((snippet) => Boolean(snippet.code))) {
      validate({ value: data.code, type: "comment", sendError: true, label: data.title + " Snippet Code" });
      validate({ value: data.title, type: "comment", sendError: true, label: data.title + " Snippet Title" });
    }

    if (id === "new") {
      const titleExists = await endpointTitleExistsFn(title);
      if (titleExists) throw { sendError: true, message: "Endpoint Title already in use" };
    } else {
      const validId = new ObjectId(id);
      if (!isValidObjectId(validId)) throw { sendError: true, message: "Specified Endpoint ID is invalid" };

      const initEndpointData = await APIHUB_ENDPOINTS.findById(validId, {
        id: "$_id",
        title: true,
        path: true,
        method: true,
        latency: true,
        response: true,
        category: true,
        snippets: true,
        description: true,
      });

      if (!initEndpointData) throw { sendError: true, message: "Endpoint has no data" };
      if (initEndpointData.id !== id) throw { sendError: true, message: "Endpoint data mismatch" };
    }

    const composeResponse = await composeHandler({ method, path });
    if (!composeResponse.success) throw { sendError: true, message: "Invalid Endpoint compose response" };

    const reference = textToId(title),
      latency = composeResponse.data?.latency,
      response = JSON.stringify(composeResponse.data?.response),
      payload = { path, title, method, snippets, category, description, reference, latency, response };

    let resId = null;

    if (id === "new") {
      const res = await APIHUB_ENDPOINTS.create({ ...payload, visibility: true });
      resId = res._id;
    } else {
      const res = await APIHUB_ENDPOINTS.findByIdAndUpdate(new ObjectId(id), { $set: { ...payload, lastUpdated: new Date() } });
      resId = res?._id;
    }

    const data = {
      success: true,
      message: id === "new" ? "Endpoint created successfully" : "Endpoint updated successfully",
      data: `Endpoint ${id === "new" ? "created" : "updated"} successfully with this ID: ${resId || id}`,
    };

    return res.status(id === "new" ? 201 : 200).json(data);
  } catch (err: any) {
    if (err.sendError && err.type === "validate") {
      const data = { success: false, message: err.description && err.description.message, data: null };
      return res.status(400).json(data);
    }

    if (err.sendError && err.type === "method") {
      const data = { success: false, message: err.message, data: null };
      return res.status(405).json(data);
    }

    return catchError({ res, err });
  }
};
