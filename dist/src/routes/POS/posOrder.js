"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const posOrderController_1 = require("../../controllers/POS/posOrderController");
const catchAsync_1 = require("../../utils/catchAsync");
const router = (0, express_1.Router)();
// Create new sale (including items and payments)
router.post("/", (0, catchAsync_1.catchAsync)(posOrderController_1.createSale));
// Get all sales for the restaurant
router.get("/", (0, catchAsync_1.catchAsync)(posOrderController_1.getAllSales));
// Get all due sales
router.get("/due", (0, catchAsync_1.catchAsync)(posOrderController_1.getDueSales));
// Get all pending sales
router.get("/pending", (0, catchAsync_1.catchAsync)(posOrderController_1.getPosPending));
// Get shift report (completed sales for the current open shift based on password)
// Note: Changed to POST since we need password in body
router.post("/shift-report", (0, catchAsync_1.catchAsync)(posOrderController_1.getShiftCompletedSales));
// Get a single pending sale by ID with items and payments
router.get("/pending/:id", (0, catchAsync_1.catchAsync)(posOrderController_1.getPosPendingById));
// Get a single sale by ID with items and payments
router.get("/:id", (0, catchAsync_1.catchAsync)(posOrderController_1.getSaleById));
// Cancel a sale
router.patch("/:id/cancel", (0, catchAsync_1.catchAsync)(posOrderController_1.cancelSale));
// Pay due sale
router.post("/:id/pay", (0, catchAsync_1.catchAsync)(posOrderController_1.payDueSale));
exports.default = router;
