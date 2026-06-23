"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllCashiers = exports.getAllSubcategories = exports.getAllCategories = exports.getCategoriesWithProducts = void 0;
const connection_1 = require("../../models/connection");
const Category_1 = require("../../models/admin/Category");
const subcategory_1 = require("../../models/admin/subcategory");
const food_1 = require("../../models/admin/food");
const cashier_1 = require("../../models/POS/cashier");
const variation_1 = require("../../models/admin/variation");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("../../utils/response");
const Errors_1 = require("../../Errors");
// ==========================================
// 1. GET CATEGORIES WITH PRODUCTS & SUBCATEGORIES
// ==========================================
// يرجع كل الكاتيجوري الخاصة بالمطعم ومعاها البرودكت والصب كاتيجوري بالبرودكت
const getCategoriesWithProducts = async (req, res) => {
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId)
        throw new Errors_1.UnauthorizedError("Unauthorized: No restaurant ID found in token");
    // 1) جلب كل المنتجات الخاصة بالمطعم
    const allFood = await connection_1.db.select().from(food_1.food)
        .where((0, drizzle_orm_1.eq)(food_1.food.restaurantid, restaurantId));
    // 2) جلب كل الصب كاتيجوري الخاصة بالمطعم (عن طريق restaurantId أو عن طريق المنتجات)
    const subsByRestaurant = await connection_1.db.select().from(subcategory_1.subcategories)
        .where((0, drizzle_orm_1.eq)(subcategory_1.subcategories.restaurantId, restaurantId));
    // جلب الصب كاتيجوري اللى المنتجات بتاعت المطعم مرتبطة بيها
    const subcategoryIdsFromFood = [...new Set(allFood.map(f => f.subcategoryid).filter(Boolean))];
    const allSubsFromDB = await connection_1.db.select().from(subcategory_1.subcategories);
    const subsFromFood = allSubsFromDB.filter(s => subcategoryIdsFromFood.includes(s.id));
    // دمج الصب كاتيجوري بدون تكرار
    const subsMap = new Map();
    for (const s of subsByRestaurant)
        subsMap.set(s.id, s);
    for (const s of subsFromFood)
        subsMap.set(s.id, s);
    const allSubcategories = Array.from(subsMap.values());
    // 3) جلب الكاتيجوري IDs المستخدمة (من المنتجات + الصب كاتيجوري)
    const categoryIdsFromFood = allFood.map(f => f.categoryid);
    const categoryIdsFromSub = allSubcategories.map(s => s.categoryId);
    const uniqueCategoryIds = [...new Set([...categoryIdsFromFood, ...categoryIdsFromSub])];
    // 4) جلب الكاتيجوري
    const allCategories = await connection_1.db.select().from(Category_1.categories);
    const relevantCategories = allCategories.filter(c => uniqueCategoryIds.includes(c.id));
    // 5) جلب الـ variations و options لكل المنتجات
    const foodIds = allFood.map(f => f.id);
    let allVariations = [];
    let allVariationOptions = [];
    if (foodIds.length > 0) {
        allVariations = await connection_1.db.select().from(variation_1.foodVariations);
        allVariations = allVariations.filter(v => foodIds.includes(v.foodId));
        const variationIds = allVariations.map(v => v.id);
        if (variationIds.length > 0) {
            allVariationOptions = await connection_1.db.select().from(variation_1.variationOptions);
            allVariationOptions = allVariationOptions.filter(o => variationIds.includes(o.variationId));
        }
    }
    // 6) بناء الريسبونس: كل كاتيجوري + البرودكت المباشرة + الصب كاتيجوري بالبرودكت
    const result = relevantCategories.map(cat => {
        // المنتجات المرتبطة بالكاتيجوري مباشرة (بدون صب كاتيجوري)
        const categoryProducts = allFood
            .filter(f => f.categoryid === cat.id && !f.subcategoryid)
            .map(f => ({
            ...f,
            variations: allVariations
                .filter(v => v.foodId === f.id)
                .map(v => ({
                ...v,
                options: allVariationOptions.filter(o => o.variationId === v.id)
            }))
        }));
        // الصب كاتيجوري المرتبطة بالكاتيجوري دي
        const catSubcategories = allSubcategories
            .filter(s => s.categoryId === cat.id)
            .map(sub => {
            // المنتجات داخل الصب كاتيجوري
            const subProducts = allFood
                .filter(f => f.subcategoryid === sub.id)
                .map(f => ({
                ...f,
                variations: allVariations
                    .filter(v => v.foodId === f.id)
                    .map(v => ({
                    ...v,
                    options: allVariationOptions.filter(o => o.variationId === v.id)
                }))
            }));
            return {
                ...sub,
                products: subProducts
            };
        });
        return {
            ...cat,
            products: categoryProducts,
            subcategories: catSubcategories
        };
    });
    return (0, response_1.SuccessResponse)(res, {
        message: "Categories with products fetched successfully",
        data: result
    });
};
exports.getCategoriesWithProducts = getCategoriesWithProducts;
// ==========================================
// 2. GET ALL CATEGORIES (للمطعم)
// ==========================================
const getAllCategories = async (req, res) => {
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId)
        throw new Errors_1.UnauthorizedError("Unauthorized: No restaurant ID found in token");
    // جلب المنتجات الخاصة بالمطعم لتحديد الكاتيجوري المستخدمة
    const restaurantFood = await connection_1.db.select({ categoryid: food_1.food.categoryid })
        .from(food_1.food)
        .where((0, drizzle_orm_1.eq)(food_1.food.restaurantid, restaurantId));
    const restaurantSubs = await connection_1.db.select({ categoryId: subcategory_1.subcategories.categoryId })
        .from(subcategory_1.subcategories)
        .where((0, drizzle_orm_1.eq)(subcategory_1.subcategories.restaurantId, restaurantId));
    const uniqueCatIds = [...new Set([
            ...restaurantFood.map(f => f.categoryid),
            ...restaurantSubs.map(s => s.categoryId)
        ])];
    const allCats = await connection_1.db.select().from(Category_1.categories);
    const result = allCats.filter(c => uniqueCatIds.includes(c.id));
    return (0, response_1.SuccessResponse)(res, {
        message: "Categories fetched successfully",
        data: result
    });
};
exports.getAllCategories = getAllCategories;
// ==========================================
// 3. GET ALL SUBCATEGORIES (للمطعم)
// ==========================================
const getAllSubcategories = async (req, res) => {
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId)
        throw new Errors_1.UnauthorizedError("Unauthorized: No restaurant ID found in token");
    const subs = await connection_1.db.select().from(subcategory_1.subcategories)
        .where((0, drizzle_orm_1.eq)(subcategory_1.subcategories.restaurantId, restaurantId));
    return (0, response_1.SuccessResponse)(res, {
        message: "Subcategories fetched successfully",
        data: subs
    });
};
exports.getAllSubcategories = getAllSubcategories;
// ==========================================
// 4. GET ALL CASHIERS (select - للمطعم)
// ==========================================
const getAllCashiers = async (req, res) => {
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId)
        throw new Errors_1.UnauthorizedError("Unauthorized: No restaurant ID found in token");
    const cashiersList = await connection_1.db.select().from(cashier_1.cashiers)
        .where((0, drizzle_orm_1.eq)(cashier_1.cashiers.restaurantid, restaurantId));
    return (0, response_1.SuccessResponse)(res, {
        message: "Cashiers fetched successfully",
        data: cashiersList
    });
};
exports.getAllCashiers = getAllCashiers;
