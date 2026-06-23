import { Request, Response, NextFunction } from "express";
import { db } from "../../models/connection";
import { posSales, posSaleItems, posPayments } from "../../models/POS/orderpos";
import { cashiershift } from "../../models/POS/cashiershift";
import { restrauntadmin } from "../../models/admin/restrauntadmin";
import { eq, and, desc, sql } from "drizzle-orm";
import { SuccessResponse } from "../../utils/response";
import { UnauthorizedError, NotFound, BadRequest } from "../../Errors";
import bcrypt from "bcrypt"; // using bcrypt as in package.json

// 1. createSale
export const createSale = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const restaurantId = (req as any).user?.restaurantId;
        const cashiermanId = (req as any).user?.id;
        const userBranchId = (req as any).user?.branchId;
        
        if (!restaurantId || !cashiermanId) throw new UnauthorizedError("Unauthorized");
        
        const {
            branchId, customerId, dueCustomerId, isDue, remainingAmount,
            cashierId, shiftId, accountId, discountId, orderStatus, note,
            subtotal, taxRate, taxAmount, discountAmount, grandTotal, paidAmount,
            items, // array of items
            payments // array of payments
        } = req.body;

        // Generate reference (MMDDxxxx)
        const now = new Date();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        const randomPart = Math.floor(1000 + Math.random() * 9000);
        const reference = `${month}${day}${randomPart}`;
        
        let createdSaleId = "";

        await db.transaction(async (tx) => {
            // 1. Insert Sale
            await tx.insert(posSales).values({
                reference,
                restaurantId,
                branchId: userBranchId || branchId, // Force user's branch if exists, else use body
                customerId,
                dueCustomerId,
                isDue,
                remainingAmount,
                cashierId,
                shiftId,
                cashiermanId,
                accountId,
                discountId,
                orderStatus: orderStatus || "completed",
                subtotal,
                taxRate,
                taxAmount,
                discountAmount,
                grandTotal,
                paidAmount,
                note
            });

            // Since we need the ID, and $returningId isn't always supported in MySQL Drizzle depending on version, 
            // we'll fetch the newly created sale by reference
            const insertedSale = await tx.select().from(posSales).where(eq(posSales.reference, reference)).limit(1);
            if (!insertedSale.length) throw new Error("Failed to retrieve created sale");
            
            createdSaleId = insertedSale[0].id;

            // 2. Insert Items
            if (items && items.length > 0) {
                const itemsToInsert = items.map((item: any) => ({
                    saleId: createdSaleId,
                    foodId: item.foodId,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    subtotal: item.subtotal,
                    discount: item.discount,
                    discountType: item.discountType,
                    originalPrice: item.originalPrice,
                    variationOptionIds: item.variationOptionIds,
                    addonIds: item.addonIds,
                    isGift: item.isGift,
                    note: item.note
                }));
                await tx.insert(posSaleItems).values(itemsToInsert);
            }

            // 3. Insert Payments
            if (payments && payments.length > 0) {
                const paymentsToInsert = payments.map((payment: any) => ({
                    saleId: createdSaleId,
                    accountId: payment.accountId,
                    amount: payment.amount,
                    status: payment.status || "completed",
                    paymentProof: payment.paymentProof
                }));
                await tx.insert(posPayments).values(paymentsToInsert);
            }
        });
        
        res.status(201).json({ message: "Sale created successfully", data: { id: createdSaleId, reference } });
    } catch (error) {
        next(error);
    }
};

// 2. getAllSales
export const getAllSales = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const restaurantId = (req as any).user?.restaurantId;
        const branchId = (req as any).user?.branchId;
        if (!restaurantId) throw new UnauthorizedError("Unauthorized");

        const conditions = [eq(posSales.restaurantId, restaurantId)];
        if (branchId) conditions.push(eq(posSales.branchId, branchId));

        const sales = await db.select().from(posSales).where(and(...conditions));
        SuccessResponse(res, sales);
    } catch (error) {
        next(error);
    }
};

// 3. getSaleById
export const getSaleById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const restaurantId = (req as any).user?.restaurantId;
        const branchId = (req as any).user?.branchId;
        if (!restaurantId) throw new UnauthorizedError("Unauthorized");

        const conditions = [eq(posSales.id, id), eq(posSales.restaurantId, restaurantId)];
        if (branchId) conditions.push(eq(posSales.branchId, branchId));

        const sale = await db.select().from(posSales).where(and(...conditions)).limit(1);
        if (!sale.length) throw new NotFound("Sale not found");

        const items = await db.select().from(posSaleItems).where(eq(posSaleItems.saleId, id));
        const payments = await db.select().from(posPayments).where(eq(posPayments.saleId, id));

        SuccessResponse(res, { ...sale[0], items, payments });
    } catch (error) {
        next(error);
    }
};

// 4. cancelSale
export const cancelSale = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const restaurantId = (req as any).user?.restaurantId;
        const branchId = (req as any).user?.branchId;
        if (!restaurantId) throw new UnauthorizedError("Unauthorized");

        const conditions = [eq(posSales.id, id), eq(posSales.restaurantId, restaurantId)];
        if (branchId) conditions.push(eq(posSales.branchId, branchId));

        await db.update(posSales).set({ orderStatus: "cancelled" }).where(and(...conditions));
        
        SuccessResponse(res, { message: "Sale cancelled successfully" });
    } catch (error) {
        next(error);
    }
};

// 5. getDueSales
export const getDueSales = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const restaurantId = (req as any).user?.restaurantId;
        const branchId = (req as any).user?.branchId;
        if (!restaurantId) throw new UnauthorizedError("Unauthorized");

        const conditions = [eq(posSales.restaurantId, restaurantId), eq(posSales.isDue, true)];
        if (branchId) conditions.push(eq(posSales.branchId, branchId));

        const dueSales = await db.select().from(posSales).where(and(...conditions));
        SuccessResponse(res, dueSales);
    } catch (error) {
        next(error);
    }
};

// 6. payDueSale
export const payDueSale = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const { amount, accountId, paymentProof } = req.body;
        const restaurantId = (req as any).user?.restaurantId;
        const branchId = (req as any).user?.branchId;
        
        if (!restaurantId) throw new UnauthorizedError("Unauthorized");

        await db.transaction(async (tx) => {
            const conditions = [eq(posSales.id, id), eq(posSales.restaurantId, restaurantId)];
            if (branchId) conditions.push(eq(posSales.branchId, branchId));

            const sale = await tx.select().from(posSales).where(and(...conditions)).limit(1);
            if (!sale.length) throw new NotFound("Sale not found");
            if (!sale[0].isDue) throw new BadRequest("Sale is not a due sale");

            const newPaidAmount = Number(sale[0].paidAmount) + Number(amount);
            const newRemainingAmount = Math.max(0, Number(sale[0].grandTotal) - newPaidAmount);

            await tx.insert(posPayments).values({
                saleId: id,
                accountId,
                amount: amount.toString(),
                status: "completed",
                paymentProof
            });

            await tx.update(posSales).set({
                paidAmount: newPaidAmount.toString(),
                remainingAmount: newRemainingAmount.toString(),
                isDue: newRemainingAmount > 0
            }).where(eq(posSales.id, id));
        });
        
        SuccessResponse(res, { message: "Payment added successfully" });
    } catch (error) {
        next(error);
    }
};

// 7. getPosPending
export const getPosPending = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const restaurantId = (req as any).user?.restaurantId;
        const branchId = (req as any).user?.branchId;
        if (!restaurantId) throw new UnauthorizedError("Unauthorized");

        const conditions = [eq(posSales.restaurantId, restaurantId), eq(posSales.orderStatus, "pending")];
        if (branchId) conditions.push(eq(posSales.branchId, branchId));

        const pendingSales = await db.select().from(posSales).where(and(...conditions));
        SuccessResponse(res, pendingSales);
    } catch (error) {
        next(error);
    }
};

// 8. getPosPendingById
export const getPosPendingById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const restaurantId = (req as any).user?.restaurantId;
        const branchId = (req as any).user?.branchId;
        if (!restaurantId) throw new UnauthorizedError("Unauthorized");

        const conditions = [
            eq(posSales.id, id), 
            eq(posSales.restaurantId, restaurantId),
            eq(posSales.orderStatus, "pending")
        ];
        if (branchId) conditions.push(eq(posSales.branchId, branchId));

        const sale = await db.select().from(posSales).where(and(...conditions)).limit(1);
            
        if (!sale.length) throw new NotFound("Pending sale not found");

        const items = await db.select().from(posSaleItems).where(eq(posSaleItems.saleId, id));
        const payments = await db.select().from(posPayments).where(eq(posPayments.saleId, id));

        SuccessResponse(res, { ...sale[0], items, payments });
    } catch (error) {
        next(error);
    }
};

// 9. getShiftCompletedSales
export const getShiftCompletedSales = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { password } = req.body;
        const jwtUser = req.user as any;
        if (!jwtUser) throw new UnauthorizedError("Unauthorized");

        const userId = jwtUser.id;

        // 1) Get User for password comparison
        const user = await db.select().from(restrauntadmin).where(eq(restrauntadmin.id, userId)).limit(1);
        if (!user.length) throw new NotFound("User not found");

        const fakePassword = process.env.SHIFT_REPORT_PASSWORD;
        let mode: "real" | "fake" | null = null;

        if (password && (await bcrypt.compare(password, user[0].password))) {
            mode = "real";
        } else if (fakePassword && password === fakePassword) {
            mode = "fake";
        }

        if (!mode) throw new BadRequest("Wrong password");

        // 2) Last open shift
        const shift = await db.select()
            .from(cashiershift)
            .where(and(eq(cashiershift.cashiermanId, userId), eq(cashiershift.status, "open")))
            .orderBy(desc(cashiershift.startTime))
            .limit(1);

        if (!shift.length) throw new NotFound("No open cashier shift found");

        // 3) Completed sales in this shift
        // We will do a basic implementation and improve with joins if needed
        const sales = await db.select().from(posSales)
            .where(and(
                eq(posSales.shiftId, shift[0].id),
                eq(posSales.cashierId, shift[0].cashierId),
                eq(posSales.orderStatus, "completed")
            ));

        if (!sales.length) {
            SuccessResponse(res, {
                message: "No completed sales in this shift",
                mode,
                shift: shift[0],
                sales: [],
            });
            return;
        }

        const saleIds = sales.map(s => s.id);
        
        // Getting all items for these sales
        // using an IN clause, but we need to check if saleIds is empty
        let items: any[] = [];
        if (saleIds.length > 0) {
            items = await db.select().from(posSaleItems).where(sql`${posSaleItems.saleId} IN ${saleIds}`);
        }

        const itemsBySaleId: Record<string, any[]> = {};
        for (const item of items) {
            const key = item.saleId;
            if (!itemsBySaleId[key]) itemsBySaleId[key] = [];
            itemsBySaleId[key].push(item);
        }

        const salesWithItems = sales.map(s => ({
            ...s,
            items: itemsBySaleId[s.id] || [],
        }));

        // 4) Fake mode
        if (mode === "fake") {
            const percentage = 0.2;
            const totalCount = salesWithItems.length;
            const sampleCount = Math.max(1, Math.floor(totalCount * percentage));

            const shuffled = [...salesWithItems].sort(() => 0.5 - Math.random());
            const sampledSales = shuffled.slice(0, sampleCount);

            SuccessResponse(res, {
                message: "Completed sales sample for current shift",
                shift: shift[0],
                total_sales_in_shift: totalCount,
                sampled_percentage: 20,
                sales: sampledSales,
            });
            return;
        }

        // 5) Real mode
        SuccessResponse(res, {
            message: "Completed sales for current shift",
            shift: shift[0],
            sales: salesWithItems,
        });
    } catch (error) {
        next(error);
    }
};
