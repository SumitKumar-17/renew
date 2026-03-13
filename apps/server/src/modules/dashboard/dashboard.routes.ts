import { Router } from "express";
import { getDashboard } from "./dashboard.controller";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";

const router = Router();

router.use(authenticate);

// GET /dashboard — operator only
router.get(
    "/",
    authorize("operator"),
    getDashboard
);

export default router;