import { Router } from "express";
import {
    createCustomer,
    getAllCustomers,
    getCustomerById,
    updateCustomer,
    deleteCustomer
} from "../../controllers/POS/customerController";
import { catchAsync } from "../../utils/catchAsync";

const router = Router();

router.post("/", catchAsync(createCustomer));
router.get("/", catchAsync(getAllCustomers));
router.get("/:id", catchAsync(getCustomerById));
router.put("/:id", catchAsync(updateCustomer));
router.delete("/:id", catchAsync(deleteCustomer));

export default router;
