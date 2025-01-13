// Used to keep Wave Research API always running
// https://console.cron-job.org/jobs

import { Request, Response } from "express";

import { catchError } from "../../utils/handlers";

export default async (req: Request, res: Response) => {
  const data = { success: true, message: `Success`, data: null };

  try {
    res.status(201).json(data);
  } catch (err: any) {
    res.status(201).json(data);

    err.respond = false;
    return catchError({ res, err });
  }
};
