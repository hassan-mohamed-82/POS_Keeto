"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const posHomeController_1 = require("../../controllers/POS/posHomeController");
const catchAsync_1 = require("../../utils/catchAsync");
const router = (0, express_1.Router)();
// الكاتيجوري كلها ومعاها البرودكت والصب كاتيجوري بالبرودكت
router.get("/categories-with-products", (0, catchAsync_1.catchAsync)(posHomeController_1.getCategoriesWithProducts));
// كل الكاتيجوري منفصلة
router.get("/categories", (0, catchAsync_1.catchAsync)(posHomeController_1.getAllCategories));
// كل الصب كاتيجوري منفصلة
router.get("/subcategories", (0, catchAsync_1.catchAsync)(posHomeController_1.getAllSubcategories));
// كل الكاشيرز (select)
router.get("/cashiers", (0, catchAsync_1.catchAsync)(posHomeController_1.getAllCashiers));
exports.default = router;
