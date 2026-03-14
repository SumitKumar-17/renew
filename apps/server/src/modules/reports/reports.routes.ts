import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { getOverview, getCharts, getTableData } from "./reports.controller";

const router = Router();
router.use(authenticate);
router.use(authorize("admin"));

router.get("/overview", getOverview);
router.get("/charts", getCharts);
router.get("/table/:module", getTableData);

export default router;
