import { Router } from "express";
import { getFeedstock, createFeedstock } from "./feedstock.controller";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { upload } from "../../middleware/upload";

const router = Router();

router.use(authenticate);

// GET /feedstock
router.get(
    "/",
    authorize("operator", "admin"),
    getFeedstock
);

// POST /feedstock — multipart/form-data with photo
router.post(
    "/",
    authorize("operator"),
    upload.single("photo"),
    createFeedstock
);

export default router;