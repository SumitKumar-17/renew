import { Router } from "express";
import { syncBatch } from "./sync.controller";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { upload } from "../../middleware/upload";

const router = Router();

router.use(authenticate);

// POST /sync/batch
// Accept multiple photos — one per offline item that needed a photo
router.post(
    "/batch",
    authorize("operator"),
    upload.any(),         // accepts multiple files with any fieldname
    syncBatch
);

export default router;