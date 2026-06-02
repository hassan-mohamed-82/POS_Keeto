import { Request, Response } from "express";
import { db } from "../../models/connection";
import { restaurantRatings, restaurants, users } from "../../models/schema";
import { eq, sql, count, avg } from "drizzle-orm";
import { SuccessResponse } from "../../utils/response";
import { NotFound } from "../../Errors/NotFound";

// ==========================================
// 1. Get Restaurant Rating Stats (Admin)
// ==========================================
export const getRestaurantRatingStats = async (req: Request, res: Response) => {
    const { restaurantId } = req.params;

    // تأكد المطعم موجود
    const [restaurant] = await db.select({ id: restaurants.id, name: restaurants.name })
        .from(restaurants).where(eq(restaurants.id, restaurantId)).limit(1);
    if (!restaurant) throw new NotFound("Restaurant not found");

    // إجمالي عدد التقييمات ومتوسط التقييم
    const [stats] = await db.select({
        totalRatings: count(restaurantRatings.id),
        averageRating: avg(restaurantRatings.rating),
    })
    .from(restaurantRatings)
    .where(eq(restaurantRatings.restaurantId, restaurantId));

    // نسب كل نجمة (1-5)
    const breakdown = await db.select({
        rating: restaurantRatings.rating,
        count: count(restaurantRatings.id),
    })
    .from(restaurantRatings)
    .where(eq(restaurantRatings.restaurantId, restaurantId))
    .groupBy(restaurantRatings.rating);

    const total = Number(stats.totalRatings) || 0;

    // بناء النسب لكل نجمة (1-5)
    const ratingBreakdown = [1, 2, 3, 4, 5].map(star => {
        const found = breakdown.find(b => b.rating === star);
        const starCount = found ? Number(found.count) : 0;
        return {
            star,
            count: starCount,
            percentage: total > 0 ? parseFloat(((starCount / total) * 100).toFixed(1)) : 0,
        };
    });

    return SuccessResponse(res, {
        data: {
            restaurant: { id: restaurant.id, name: restaurant.name },
            totalRatings: total,
            averageRating: stats.averageRating ? parseFloat(Number(stats.averageRating).toFixed(1)) : 0,
            breakdown: ratingBreakdown,
        }
    });
};

// ==========================================
// 2. Get All Ratings for a Restaurant (Admin - with user info)
// ==========================================
export const getRestaurantRatings = async (req: Request, res: Response) => {
    const { restaurantId } = req.params;

    const ratings = await db.select({
        id: restaurantRatings.id,
        rating: restaurantRatings.rating,
        comment: restaurantRatings.comment,
        createdAt: restaurantRatings.createdAt,
        userName: users.name,
        userEmail: users.email,
        userPhoto: users.photo,
    })
    .from(restaurantRatings)
    .leftJoin(users, eq(restaurantRatings.userId, users.id))
    .where(eq(restaurantRatings.restaurantId, restaurantId));

    return SuccessResponse(res, { data: ratings });
};


export const deleteRating = async (req: Request, res: Response) => {
    const { id } = req.params;
    const [rating] = await db.select().from(restaurantRatings).where(eq(restaurantRatings.id, id)).limit(1);
    if (!rating) throw new NotFound("Rating not found");
    await db.delete(restaurantRatings).where(eq(restaurantRatings.id, id));
    return SuccessResponse(res, { data: null });
}
