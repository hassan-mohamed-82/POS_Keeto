import { Router } from "express";
import {
    startcashierShift,
    endshiftcashier,
    endShiftWithReport,
    logout
} from "../../controllers/POS/cashiershiftController";
import { catchAsync } from "../../utils/catchAsync";
const router = Router();

// Your translated custom routes
router.post("/start", catchAsync(startcashierShift));
router.post("/end", catchAsync(endshiftcashier));
router.post("/end-with-report", catchAsync(endShiftWithReport));
router.post("/logout", catchAsync(logout));



export default router;
