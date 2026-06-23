import { Request, Response, NextFunction } from "express";
import { db } from "../../models/connection";
import { expenss } from "../../models/POS/expenss";
import { eq } from "drizzle-orm";
import { expensscategory } from "../../models/schema";
import { SuccessResponse } from "../../utils/response";
import { UnauthorizedError } from "../../Errors";
export const createExpense = async (req: Request, res: Response): Promise<void> => {
        const restaurantid = (req as any).user?.restaurantId;
        const { name, amount, categoryId, shiftId, cashierId, cashiermanId, note, paymentmethodId } = req.body;
        if (!restaurantid) {
            throw new UnauthorizedError("Unauthorized: No restaurant ID found in token");
        }
        await db.insert(expenss).values({
            restaurantid,
            name,
            amount,
            categoryId,
            shiftId,
            cashierId,
            cashiermanId,
            note,
            paymentmethodId
        });
        return SuccessResponse(res, { message: "Expense created successfully" });
    
};

export const getAllExpenses = async (req: Request, res: Response): Promise<void> => {
    const expenses = await db.select().from(expenss);
    return SuccessResponse(res, { message: "Expenses fetched successfully", data: expenses });
};

export const getExpenseById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const expense = await db.select().from(expenss).where(eq(expenss.id, id));
    if (!expense.length) {
        res.status(404).json({ message: "Expense not found" });
        return;
    }
    return SuccessResponse(res, { message: "Expense fetched successfully", data: expense[0] });
};

export const updateExpense = async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;
        const { name, amount, categoryId, shiftId, cashierId, cashiermanId, note, paymentmethodId } = req.body;
        await db.update(expenss).set({
            name,
            amount,
            categoryId,
            shiftId,
            cashierId,
            cashiermanId,
            note,
            paymentmethodId
        }).where(eq(expenss.id, id));
        return SuccessResponse(res, { message: "Expense updated successfully" });
    };

export const deleteExpense = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    await db.delete(expenss).where(eq(expenss.id, id));
    return SuccessResponse(res, { message: "Expense deleted successfully" });
};

export const getAllExpensesscategory = async (req: Request, res: Response): Promise<void> => {
    const expenses = await db.select().from(expensscategory);
    return SuccessResponse(res, { message: "Expense category fetched successfully", data: expenses });
};
