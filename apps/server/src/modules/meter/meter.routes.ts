import { Router } from "express";
import {
    getMeterReadings,
    getLastReading,
    createMeterReading,
} from "./meter.controller";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { upload } from "../../middleware/upload";

const router = Router();

router.use(authenticate);

// GET /meter
router.get(
    "/",
    authorize("operator", "admin"),
    getMeterReadings
);

// GET /meter/last — operator dashboard
router.get(
    "/last",
    authorize("operator"),
    getLastReading
);

// POST /meter
router.post(
    "/",
    authorize("operator"),
    upload.single("photo"),
    createMeterReading
);

export default router;