import { Router } from "express";
import { getCompost, createCompost } from "./compost.controller";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { upload } from "../../middleware/upload";

const router = Router();

router.use(authenticate);

// GET /compost
router.get(
    "/",
    authorize("operator", "admin"),
    getCompost
);

// POST /compost
router.post(
    "/",
    authorize("operator"),
    upload.single("photo"),
    createCompost
);

export default router;