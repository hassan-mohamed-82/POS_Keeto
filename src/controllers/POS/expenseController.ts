import { Request, Response, NextFunction } from "express";
import { db } from "../../models/connection";
import { expenss, cashiershift, FinancialAccounts } from "../../models/schema";
import { eq, and, sql } from "drizzle-orm";
import { BadRequest, NotFound } from "../../Errors";
import { SuccessResponse } from "../../utils/response";

export const createExpense = async (req: Request, res: Response) => {
    const restaurantId = req.user?.restaurantId || req.user?.id;
    if (!restaurantId) throw new BadRequest("Restaurant context missing");

    const { name, amount, categoryId, shiftId, cashierId, note, financialAccountId } = req.body;
    const cashiermanId = req.user?.id;

    if (!cashiermanId) throw new BadRequest("User context missing");

    let actualShiftId = shiftId;

    if (shiftId) {
        const [providedShift] = await db.select().from(cashiershift)
            .where(and(eq(cashiershift.id, shiftId), eq(cashiershift.status, "open")))
            .limit(1);
        if (!providedShift) {
            throw new BadRequest("The provided shift is not open or does not exist");
        }
    } else {
        const [openShift] = await db.select().from(cashiershift)
            .where(and(
                eq(cashiershift.cashiermanId, cashiermanId),
                eq(cashiershift.status, "open")
            ))
            .limit(1);

        if (!openShift) {
            throw new BadRequest("You must have an open shift to create an expense");
        }
        actualShiftId = openShift.id;
    }

    if (!financialAccountId) {
        throw new BadRequest("Financial Account ID is required");
    }

    const [account] = await db.select().from(FinancialAccounts)
        .where(and(
            eq(FinancialAccounts.id, financialAccountId),
            eq(FinancialAccounts.restaurantId, restaurantId)
        ))
        .limit(1);

    if (!account) {
        throw new NotFound("Financial account not found");
    }

    if (Number(account.balance) < Number(amount)) {
        throw new BadRequest("Insufficient funds in the selected financial account");
    }

    await db.transaction(async (tx) => {
        await tx.insert(expenss).values({
            restrauntid: restaurantId,
            name,
            amount,
            categoryId,
            shiftId: actualShiftId,
            cashierId,
            cashiermanId,
            note,
            financialAccountId
        });

        await tx.update(FinancialAccounts)
            .set({ balance: sql`${FinancialAccounts.balance} - ${amount}` })
            .where(eq(FinancialAccounts.id, financialAccountId));

        await tx.update(cashiershift)
            .set({ totalExpenses: sql`${cashiershift.totalExpenses} + ${amount}` })
            .where(eq(cashiershift.id, actualShiftId));
    });

    return SuccessResponse(res, { message: "Expense created successfully" }, 201);
};

export const getAllExpenses = async (req: Request, res: Response) => {
    const restaurantId = req.user?.restaurantId || req.user?.id;
    if (!restaurantId) throw new BadRequest("Restaurant context missing");

    const expenses = await db.select().from(expenss)
        .where(eq(expenss.restrauntid, restaurantId));

    return SuccessResponse(res, { message: "Expenses fetched successfully", data: expenses });
};

export const getExpenseById = async (req: Request, res: Response) => {
    const restaurantId = req.user?.restaurantId || req.user?.id;
    if (!restaurantId) throw new BadRequest("Restaurant context missing");

    const { id } = req.params;
    const [expense] = await db.select().from(expenss)
        .where(and(eq(expenss.id, id), eq(expenss.restrauntid, restaurantId)))
        .limit(1);

    if (!expense) throw new NotFound("Expense not found");

    return SuccessResponse(res, { message: "Expense fetched successfully", data: expense });
};

export const updateExpense = async (req: Request, res: Response) => {
    const restaurantId = req.user?.restaurantId || req.user?.id;
    if (!restaurantId) throw new BadRequest("Restaurant context missing");

    const { id } = req.params;
    const { name, amount, categoryId, shiftId, cashierId, note, financialAccountId } = req.body;

    const [existing] = await db.select().from(expenss)
        .where(and(eq(expenss.id, id), eq(expenss.restrauntid, restaurantId)))
        .limit(1);
    if (!existing) throw new NotFound("Expense not found");

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (amount !== undefined) updateData.amount = amount;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (shiftId !== undefined) updateData.shiftId = shiftId;
    if (cashierId !== undefined) updateData.cashierId = cashierId;
    if (note !== undefined) updateData.note = note;
    if (financialAccountId !== undefined) updateData.financialAccountId = financialAccountId;

    await db.update(expenss).set(updateData).where(eq(expenss.id, id));

    return SuccessResponse(res, { message: "Expense updated successfully" });
};

export const deleteExpense = async (req: Request, res: Response) => {
    const restaurantId = req.user?.restaurantId || req.user?.id;
    if (!restaurantId) throw new BadRequest("Restaurant context missing");

    const { id } = req.params;

    const [existing] = await db.select().from(expenss)
        .where(and(eq(expenss.id, id), eq(expenss.restrauntid, restaurantId)))
        .limit(1);
    if (!existing) throw new NotFound("Expense not found");

    await db.delete(expenss).where(eq(expenss.id, id));

    return SuccessResponse(res, { message: "Expense deleted successfully" });
};
