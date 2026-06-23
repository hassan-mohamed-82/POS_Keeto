import { Request, Response, NextFunction } from "express";
import { db } from "../../models/connection";
import { expensscategory } from "../../models/POS/expensscategory";
import { eq } from "drizzle-orm";

export const createExpenseCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const restaurantid = (req as any).user?.restaurantId;
        const { name, arName } = req.body;
        if (!restaurantid) {
            res.status(401).json({ message: "Unauthorized: No restaurant ID found in token" });
            return;
        }
        await db.insert(expensscategory).values({ restaurantid, name, arName });
        res.status(201).json({ message: "Expense category created successfully" });
    } catch (error) {
        next(error);
    }
};

export const getAllExpenseCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const categories = await db.select().from(expensscategory);
        res.status(200).json(categories);
    } catch (error) {
        next(error);
    }
};

export const getExpenseCategoryById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const category = await db.select().from(expensscategory).where(eq(expensscategory.id, id));
        if (!category.length) {
            res.status(404).json({ message: "Category not found" });
            return;
        }
        res.status(200).json(category[0]);
    } catch (error) {
        next(error);
    }
};

export const updateExpenseCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const { name, arName } = req.body;
        await db.update(expensscategory).set({ name, arName }).where(eq(expensscategory.id, id));
        res.status(200).json({ message: "Expense category updated successfully" });
    } catch (error) {
        next(error);
    }
};

export const deleteExpenseCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        await db.delete(expensscategory).where(eq(expensscategory.id, id));
        res.status(200).json({ message: "Expense category deleted successfully" });
    } catch (error) {
        next(error);
    }
};
