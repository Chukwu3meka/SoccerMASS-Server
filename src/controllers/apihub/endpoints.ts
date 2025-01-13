import validator from "../../utils/validate";

import { BSON } from "mongodb";
import { Request, Response } from "express";
import { APIHUB_ENDPOINTS } from "../../models/apihub.model";
import { catchError, range, requestHasBody } from "../../utils/handlers";

export default async (req: Request, res: Response) => {
  try {
    const hasFilterParam = Object.hasOwn(req.query, "filter");
    if (!hasFilterParam) throw { message: "Filter not specified", sendError: true };

    requestHasBody({ body: req.query, required: ["filter"], sendError: true });

    switch (req.query.filter) {
      case "all": {
        const hasPageParam = Object.hasOwn(req.query, "page");
        if (!hasPageParam) throw { message: "Page not specified", sendError: true };

        const hasSizeParam = Object.hasOwn(req.query, "size");
        if (!hasSizeParam) throw { message: "Size not specified", sendError: true };

        requestHasBody({ body: req.query, required: ["size", "page"], sendError: true });

        const size = parseInt(req.query.size as any),
          page = parseInt(req.query.page as any);

        if (page < 0) throw { message: "Invalid Page Number specified", sendError: true };
        if (![20].includes(size)) throw { message: "Invalid Size specified", sendError: true };

        // ? Single fetch with skip and limit returns unexpected result
        // ? https://www.mongodb.com/community/forums/t/cursor-pagination-using-objectid-timestamp-field-in-mongodb/122170/2

        const result = await APIHUB_ENDPOINTS.aggregate([
          { $match: { visibility: true } },
          { $sort: { lastUpdated: -1, _id: 1 } },
          { $skip: page * size },
          { $limit: size },
          {
            $project: {
              _id: false,
              id: "$_id",
              path: true,
              title: true,
              latency: true,
              reference: true,
              bookmarks: true,
              description: true,
              lastUpdated: true,
            },
          },
        ]);

        const resultCount = await APIHUB_ENDPOINTS.aggregate([{ $count: "totalElements" }]);

        const data = {
          success: true,
          message: result.length ? "Endpoints retrieved successfully" : "Failed to retrieve any endpoint",
          data: { size, page, totalElements: resultCount[0] ? resultCount[0].totalElements : 0, content: result },
        };

        return res.status(200).json(data);
      }

      case "category": {
        const hasPageParam = Object.hasOwn(req.query, "page");
        if (!hasPageParam) throw { message: "Page not specified", sendError: true };

        const hasSizeParam = Object.hasOwn(req.query, "size");
        if (!hasSizeParam) throw { message: "Size not specified", sendError: true };

        const hasCategoryParam = Object.hasOwn(req.query, "category");
        if (!hasCategoryParam) throw { message: "Category not specified", sendError: true };

        requestHasBody({ body: req.query, required: ["size", "page", "category"], sendError: true });

        const category = req.query.category as string,
          size = parseInt(req.query.size as any),
          page = parseInt(req.query.page as any);

        if (page < 0) throw { message: "Invalid Page Number specified", sendError: true };
        if (![20].includes(size)) throw { message: "Invalid Size specified", sendError: true };
        if (!category || category.length !== 24) throw { message: "Invalid Category specified", sendError: true };

        // ? Single fetch with skip and limit returns unexpected result
        // ? https://www.mongodb.com/community/forums/t/cursor-pagination-using-objectid-timestamp-field-in-mongodb/122170/2

        const filterParam = { category: new BSON.ObjectId(category), visibility: true };

        const result = await APIHUB_ENDPOINTS.aggregate([
          { $match: filterParam },
          { $sort: { lastUpdated: -1, _id: 1 } },
          { $skip: page * size },
          { $limit: size },
          {
            $project: {
              _id: false,
              id: "$_id",
              path: true,
              title: true,
              latency: true,
              reference: true,
              bookmarks: true,
              description: true,
              lastUpdated: true,
            },
          },
        ]);

        const resultCount = await APIHUB_ENDPOINTS.aggregate([{ $match: filterParam }, { $count: "totalElements" }]);

        const data = {
          success: true,
          message: result.length ? "Endpoints retrieved successfully" : "Failed to retrieve any endpoint",
          data: { size, page, totalElements: resultCount[0] ? resultCount[0].totalElements : 0, content: result },
        };

        return res.status(200).json(data);
      }

      case "search": {
        const hasSequenceParam = Object.hasOwn(req.query, "sequence");
        if (!hasSequenceParam) throw { message: "Sequence not specified", sendError: true };

        const hasTokenParam = Object.hasOwn(req.query, "token");
        if (!hasTokenParam) throw { message: "Token not specified", sendError: true };

        const hasSearchParam = Object.hasOwn(req.query, "phrase");
        if (!hasSearchParam) throw { message: "Search Param not specified", sendError: true };

        const hasSizeParam = Object.hasOwn(req.query, "size");
        if (!hasSizeParam) throw { message: "Size not specified", sendError: true };

        requestHasBody({ body: req.query, required: ["phrase", "token", "sequence"], sendError: true });

        const size = parseInt(req.query.size as any),
          { phrase, token, sequence } = req.query as any;

        if (!["next", "prev"].includes(<any>req.query.sequence)) throw { message: "Invalid Search Sequence" };

        if (token !== "null") validator({ type: "comment", value: token, sendError: true });
        validator({ type: "comment", label: "Search Phrase", value: phrase, sendError: true });
        if (![3, 20].includes(size)) throw { message: "Invalid size specified", sendError: true };

        const result = await APIHUB_ENDPOINTS.aggregate([
          {
            $search:
              token === "null"
                ? {
                    index: "default",
                    compound: {
                      should: [
                        {
                          autocomplete: {
                            query: phrase,
                            path: "title",
                            score: { boost: { value: 3 } },
                            fuzzy: { maxEdits: 2, prefixLength: 3 },
                          },
                        },
                        { text: { query: phrase, path: "description" } },
                        { text: { query: phrase, path: "category" } },
                      ],
                    },
                    sort: {
                      lastUpdated: 1,
                      unused: { $meta: "searchScore" },
                    },

                    count: {
                      type: "total",
                    },
                  }
                : {
                    index: "default",
                    compound: {
                      should: [
                        {
                          autocomplete: {
                            query: phrase,
                            path: "title",
                            score: { boost: { value: 3 } },
                            fuzzy: { maxEdits: 2, prefixLength: 3 },
                          },
                        },
                        { text: { query: phrase, path: "description" } },
                        { text: { query: phrase, path: "category" } },
                      ],
                    },
                    [sequence === "next" ? "searchAfter" : "searchBefore"]: token,
                    sort: {
                      lastUpdated: 1,
                      unused: { $meta: "searchScore" },
                    },

                    count: {
                      type: "total",
                    },
                  },
          },
          { $limit: size },
          {
            $project: {
              _id: 0,
              title: 1,
              id: "$_id",
              path: true,
              latency: true,
              description: 1,
              reference: true,
              bookmarks: true,
              lastUpdated: true,
              meta: "$$SEARCH_META",
              paginationToken: { $meta: "searchSequenceToken" },
            },
          },
        ]);

        const data = {
          success: true,
          data: { size, totalElements: result[0] ? result[0].meta.count.total : 0, content: result },
          message: result.length ? "Endpoints similar to Search Phrase retrieved" : "Could not match endpoints with search phrase",
        };

        return res.status(200).json(data);
      }

      default:
        throw { message: "No handler for specified filter", sendError: true };
    }
  } catch (err: any) {
    if (err.sendError && err.type === "validate") {
      // const data = { success: false, message: "Endpoints could not be retrieved", data: null };
      const data = { success: false, message: err.description && err.description.message, data: null };
      return res.status(400).json(data);
    }

    return catchError({ res, err });
  }
};
