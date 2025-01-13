import { Request, Response } from "express";
import { SIZES } from "../../../utils/constants";
import { INFO_ALL_DAILY_STAT } from "../../../models/info.model";
import { catchError, requestHasBody } from "../../../utils/handlers";

export default async function dailyStatistics(req: Request, res: Response) {
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

      result = await INFO_ALL_DAILY_STAT.aggregate([
        // { $match: { title: { $regex: new RegExp(filter as string, "i") } } }, // Optional, 'i' for case-insensitive
        { $match: { date: filter } }, // Optional, 'i' for case-insensitive
        { $sort: { date: -1, _id: 1 } },
        { $skip: page * size },
        { $limit: size },
        { $project: { date: true, accounts: true, apihub: true, console: true, manager: true, info: true, _id: false } },
      ]);

      resultCount = await INFO_ALL_DAILY_STAT.aggregate([{ $match: { date: filter } }, { $count: "totalElements" }]);
    } else {
      resultCount = await INFO_ALL_DAILY_STAT.aggregate([{ $count: "totalElements" }]);

      result = await INFO_ALL_DAILY_STAT.aggregate([
        { $sort: { date: -1, _id: 1 } },
        { $skip: page * size },
        { $limit: size },
        { $project: { date: true, accounts: true, apihub: true, console: true, manager: true, info: true, _id: false } },
      ]);
    }

    const data = {
      success: true,
      message: result.length ? "Daily Stats retrieved successfully" : "Failed to retrieve any daily statistics",
      data: { size, page, totalElements: resultCount ? (resultCount[0] ? resultCount[0].totalElements : 0) : 0, content: result },
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
