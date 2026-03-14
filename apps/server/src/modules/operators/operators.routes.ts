import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import {
    getOperators,
    createOperator,
    updateOperatorStatus,
} from "./operators.controller";

const router = Router();
router.use(authenticate);
router.use(authorize("admin"));

router.get("/", getOperators);
router.post("/", createOperator);
router.patch("/:id/status", updateOperatorStatus);

export default router;
