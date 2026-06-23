import { Router } from "express";
import {
    createSale,
    getAllSales,
    getSaleById,
    cancelSale,
    getDueSales,
    payDueSale,
    getPosPending,
    getPosPendingById,
    getShiftCompletedSales
} from "../../controllers/POS/posOrderController";
import { catchAsync } from "../../utils/catchAsync";

const router = Router();

// Create new sale (including items and payments)
router.post("/", catchAsync(createSale));

// Get all sales for the restaurant
router.get("/", catchAsync(getAllSales));

// Get all due sales
router.get("/due", catchAsync(getDueSales));

// Get all pending sales
router.get("/pending", catchAsync(getPosPending));

// Get shift report (completed sales for the current open shift based on password)
// Note: Changed to POST since we need password in body
router.post("/shift-report", catchAsync(getShiftCompletedSales));

// Get a single pending sale by ID with items and payments
router.get("/pending/:id", catchAsync(getPosPendingById));

// Get a single sale by ID with items and payments
router.get("/:id", catchAsync(getSaleById));

// Cancel a sale
router.patch("/:id/cancel", catchAsync(cancelSale));

// Pay due sale
router.post("/:id/pay", catchAsync(payDueSale));

export default router;
