import { Request, Response } from "express";
import { SIZES } from "../../../utils/constants";
import { INFO_ALL_FAILED_REQUESTS } from "../../../models/info.model";
import { catchError, requestHasBody } from "../../../utils/handlers";

export default async function failedRequests(req: Request, res: Response) {
  try {
    const hasPageParam = Object.hasOwn(req.query, "page");
    if (!hasPageParam) throw { message: "Page not specified", sendError: true };

    const hasSizeParam = Object.hasOwn(req.query, "size");
    if (!hasSizeParam) throw { message: "Size not specified", sendError: true };

    requestHasBody({ body: req.query, required: ["size", "page"], sendError: true });

    const [size, page] = [parseInt(req.query.size as any), parseInt(req.query.page as any)];
    if (page < 0) throw { message: "Invalid Page Number specified", sendError: true };
    if (!SIZES.includes(size)) throw { message: "Invalid Size specified", sendError: true };

    let result, resultCount;
    const hasFilterParam = Object.hasOwn(req.query, "filter");
    if (!hasFilterParam) throw { message: "Invalid Date Params", sendError: true };

    const filter = req.query.filter;

    if (filter) {
      let datePattern = /^\d{4}-\d{2}-\d{2}$/;
      if (!datePattern.test(filter as string)) throw { message: "Invalid Date Params format", sendError: true };

      const [tempYear, tempMonth, tempDay] = (filter as string).split("-"),
        [year, month, day] = [parseInt(tempYear), parseInt(tempMonth), parseInt(tempDay)];

      const today = new Date();
      if (year > today.getUTCFullYear() || month > today.getUTCMonth() + 1 || day > today.getUTCDate())
        throw { message: "Date range is broken", sendError: true };

      result = await INFO_ALL_FAILED_REQUESTS.aggregate([
        { $match: { date: { $regex: new RegExp(filter as string, "i") } } },
        { $sort: { time: -1, _id: 1 } },
        { $skip: page * size },
        { $limit: size },
        { $project: { _id: false, id: "$_id", data: true, date: true, error: true, request: true, time: true } },
      ]);

      resultCount = await INFO_ALL_FAILED_REQUESTS.aggregate([
        { $match: { date: { $regex: new RegExp(filter as string, "i") } } },
        { $count: "totalElements" },
      ]);
    } else {
      resultCount = await INFO_ALL_FAILED_REQUESTS.aggregate([{ $count: "totalElements" }]);

      result = await INFO_ALL_FAILED_REQUESTS.aggregate([
        { $sort: { time: -1, _id: 1 } },
        { $skip: page * size },
        { $limit: size },
        { $project: { _id: false, id: "$_id", data: true, date: true, error: true, request: true, time: true } },
      ]);
    }

    const data = {
      success: true,
      message: result.length ? "All requests retrieved successfully" : "Failed to retrieve any requests",
      data: {
        size,
        page,
        content: result,
        totalElements: resultCount ? (resultCount[0] ? resultCount[0].totalElements : 0) : 0,
      },
    };

    return res.status(200).json(data);
  } catch (err: any) {
    if (err.sendError && err.type === "validate") {
      const data = { success: false, message: err.description && err.description.message, data: null };
      return res.status(400).json(data);
    }

    return catchError({ res, err });
  }
}
