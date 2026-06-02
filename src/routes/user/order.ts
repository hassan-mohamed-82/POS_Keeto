import { Router } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { checkout, getOrderDetails, getActiveOrders,getOrderHistory 
    ,getOrderPrerequisites
} from "../../controllers/user/order";
const router = Router();
router.get("/select", catchAsync(getOrderPrerequisites));
router.post("/checkout", catchAsync(checkout));
router.get("/active", catchAsync(getActiveOrders));
router.get("/history", catchAsync(getOrderHistory));
router.get("/:orderId", catchAsync(getOrderDetails));
export default router;