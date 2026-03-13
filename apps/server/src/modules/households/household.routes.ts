import { Router } from "express";
import {
    getHouseholds,
    getHouseholdById,
    createHousehold,
} from "./household.controller";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";

const router = Router();

// All household routes require authentication
router.use(authenticate);

// GET /households — operator gets own, admin gets all
router.get(
    "/",
    authorize("operator", "admin"),
    getHouseholds
);

// GET /households/:id
router.get(
    "/:id",
    authorize("operator", "admin"),
    getHouseholdById
);

// POST /households — operator and admin can create
router.post(
    "/",
    authorize("operator", "admin"),
    createHousehold
);

export default router;