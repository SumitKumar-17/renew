import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import {
    getDigesters,
    getDigesterById,
    createDigester,
    updateDigesterStatus,
} from "./digester.controller";

const router = Router();
router.use(authenticate);
router.use(authorize("admin"));

router.get("/", getDigesters);
router.get("/:id", getDigesterById);
router.post("/", createDigester);
router.patch("/:id/status", updateDigesterStatus);

export default router;
