import { Router } from "express";
import {
    getCategoriesWithProducts,
    getAllCategories,
    getAllSubcategories,
    getAllCashiers
} from "../../controllers/POS/posHomeController";
import { catchAsync } from "../../utils/catchAsync";

const router = Router();

// الكاتيجوري كلها ومعاها البرودكت والصب كاتيجوري بالبرودكت
router.get("/categories-with-products", catchAsync(getCategoriesWithProducts));

// كل الكاتيجوري منفصلة
router.get("/categories", catchAsync(getAllCategories));

// كل الصب كاتيجوري منفصلة
router.get("/subcategories", catchAsync(getAllSubcategories));

// كل الكاشيرز (select)
router.get("/cashiers", catchAsync(getAllCashiers));

export default router;
