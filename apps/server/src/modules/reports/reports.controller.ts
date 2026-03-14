import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { reportsService } from "./reports.service";

// GET /reports/overview
export const getOverview = asyncHandler(async (req: Request, res: Response) => {
    const data = await reportsService.getOverview();
    res.json({ success: true, data });
});

// GET /reports/charts
export const getCharts = asyncHandler(async (req: Request, res: Response) => {
    const data = await reportsService.getCharts();
    res.json({ success: true, data });
});

// GET /reports/table/:module
export const getTableData = asyncHandler(async (req: Request, res: Response) => {
    const { module } = req.params;
    const { from, to } = req.query as { from?: string; to?: string };

    const validModules = ["feedstock", "meter", "distribution", "compost"];
    if (!validModules.includes(module)) {
        res.status(400).json({ success: false, message: "Invalid module" });
        return;
    }

    const data = await reportsService.getTableData(module, from, to);
    res.json({ success: true, data });
});
