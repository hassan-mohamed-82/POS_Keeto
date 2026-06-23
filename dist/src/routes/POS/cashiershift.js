"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cashiershiftController_1 = require("../../controllers/POS/cashiershiftController");
const catchAsync_1 = require("../../utils/catchAsync");
const router = (0, express_1.Router)();
// Your translated custom routes
router.post("/start", (0, catchAsync_1.catchAsync)(cashiershiftController_1.startcashierShift));
router.post("/end", (0, catchAsync_1.catchAsync)(cashiershiftController_1.endshiftcashier));
router.post("/end-with-report", (0, catchAsync_1.catchAsync)(cashiershiftController_1.endShiftWithReport));
router.post("/logout", (0, catchAsync_1.catchAsync)(cashiershiftController_1.logout));
exports.default = router;
