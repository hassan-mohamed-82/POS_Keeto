import { Request, Response } from "express";
import { db } from "../../models/connection";
import { categories } from "../../models/admin/Category";
import { subcategories } from "../../models/admin/subcategory";
import { food } from "../../models/admin/food";
import { cashiers } from "../../models/POS/cashier";
import { foodVariations, variationOptions } from "../../models/admin/variation";
import { eq, and } from "drizzle-orm";
import { SuccessResponse } from "../../utils/response";
import { UnauthorizedError } from "../../Errors";

// ==========================================
// 1. GET CATEGORIES WITH PRODUCTS & SUBCATEGORIES
// ==========================================
// يرجع كل الكاتيجوري الخاصة بالمطعم ومعاها البرودكت والصب كاتيجوري بالبرودكت
export const getCategoriesWithProducts = async (req: Request, res: Response) => {
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) throw new UnauthorizedError("Unauthorized: No restaurant ID found in token");

    // 1) جلب كل المنتجات الخاصة بالمطعم
    const allFood = await db.select().from(food)
        .where(eq(food.restaurantid, restaurantId));

    // 2) جلب كل الصب كاتيجوري الخاصة بالمطعم
    const allSubcategories = await db.select().from(subcategories)
        .where(eq(subcategories.restaurantId, restaurantId));

    // 3) جلب الكاتيجوري IDs المستخدمة (من المنتجات + الصب كاتيجوري)
    const categoryIdsFromFood = allFood.map(f => f.categoryid);
    const categoryIdsFromSub = allSubcategories.map(s => s.categoryId);
    const uniqueCategoryIds = [...new Set([...categoryIdsFromFood, ...categoryIdsFromSub])];

    // 4) جلب الكاتيجوري
    const allCategories = await db.select().from(categories);
    const relevantCategories = allCategories.filter(c => uniqueCategoryIds.includes(c.id));

    // 5) جلب الـ variations و options لكل المنتجات
    const foodIds = allFood.map(f => f.id);
    let allVariations: any[] = [];
    let allVariationOptions: any[] = [];

    if (foodIds.length > 0) {
        allVariations = await db.select().from(foodVariations);
        allVariations = allVariations.filter(v => foodIds.includes(v.foodId));

        const variationIds = allVariations.map(v => v.id);
        if (variationIds.length > 0) {
            allVariationOptions = await db.select().from(variationOptions);
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

    return SuccessResponse(res, {
        message: "Categories with products fetched successfully",
        data: result
    });
};

// ==========================================
// 2. GET ALL CATEGORIES (للمطعم)
// ==========================================
export const getAllCategories = async (req: Request, res: Response) => {
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) throw new UnauthorizedError("Unauthorized: No restaurant ID found in token");

    // جلب المنتجات الخاصة بالمطعم لتحديد الكاتيجوري المستخدمة
    const restaurantFood = await db.select({ categoryid: food.categoryid })
        .from(food)
        .where(eq(food.restaurantid, restaurantId));

    const restaurantSubs = await db.select({ categoryId: subcategories.categoryId })
        .from(subcategories)
        .where(eq(subcategories.restaurantId, restaurantId));

    const uniqueCatIds = [...new Set([
        ...restaurantFood.map(f => f.categoryid),
        ...restaurantSubs.map(s => s.categoryId)
    ])];

    const allCats = await db.select().from(categories);
    const result = allCats.filter(c => uniqueCatIds.includes(c.id));

    return SuccessResponse(res, {
        message: "Categories fetched successfully",
        data: result
    });
};

// ==========================================
// 3. GET ALL SUBCATEGORIES (للمطعم)
// ==========================================
export const getAllSubcategories = async (req: Request, res: Response) => {
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) throw new UnauthorizedError("Unauthorized: No restaurant ID found in token");

    const subs = await db.select().from(subcategories)
        .where(eq(subcategories.restaurantId, restaurantId));

    return SuccessResponse(res, {
        message: "Subcategories fetched successfully",
        data: subs
    });
};

// ==========================================
// 4. GET ALL CASHIERS (select - للمطعم)
// ==========================================
export const getAllCashiers = async (req: Request, res: Response) => {
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) throw new UnauthorizedError("Unauthorized: No restaurant ID found in token");

    const cashiersList = await db.select().from(cashiers)
        .where(eq(cashiers.restaurantid, restaurantId));

    return SuccessResponse(res, {
        message: "Cashiers fetched successfully",
        data: cashiersList
    });
};
