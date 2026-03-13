import { Router } from "express";
import {
    getDistribution,
    getBalance,
    createDistribution,
} from "./distribution.controller";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";

const router = Router();

router.use(authenticate);

// GET /distribution/balance — must be before /:id routes
router.get(
    "/balance",
    authorize("operator"),
    getBalance
);

// GET /distribution
router.get(
    "/",
    authorize("operator", "admin"),
    getDistribution
);

// POST /distribution
// Note: no photo upload here — distribution has no photo requirement
router.post(
    "/",
    authorize("operator"),
    createDistribution
);

export default router;