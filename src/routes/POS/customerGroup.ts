import { Router } from "express";
import {
    createCustomerGroup,
    getAllCustomerGroups,
    getCustomerGroupById,
    updateCustomerGroup,
    deleteCustomerGroup
} from "../../controllers/POS/customerGroupController";
import { catchAsync } from "../../utils/catchAsync";

const router = Router();

router.post("/", catchAsync(createCustomerGroup));
router.get("/", catchAsync(getAllCustomerGroups));
router.get("/:id", catchAsync(getCustomerGroupById));
router.put("/:id", catchAsync(updateCustomerGroup));
router.delete("/:id", catchAsync(deleteCustomerGroup));

export default router;
