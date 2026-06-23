import { Request, Response, NextFunction } from "express";
import { db } from "../../models/connection";
import { cashiershift } from "../../models/POS/cashiershift";
import { cashiers } from "../../models/POS/cashier";
import { eq, and, desc } from "drizzle-orm";

// ==========================================
// 1. STANDARD CRUD
// ==========================================

export const createCashierShift = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const restaurantid = (req as any).user?.restaurantId;
        const { cashiermanId, cashierId, status, totalSaleAmount, totalExpenses, netCashInDrawer } = req.body;
        if (!restaurantid) {
            res.status(401).json({ message: "Unauthorized: No restaurant ID found in token" });
            return;
        }
        await db.insert(cashiershift).values({
            restaurantid,
            cashiermanId,
            cashierId,
            status,
            
            totalSaleAmount,
            totalExpenses,
            netCashInDrawer
        });
        res.status(201).json({ message: "Cashier shift created successfully" });
    } catch (error) {
        next(error);
    }
};

export const getAllCashierShifts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const shifts = await db.select().from(cashiershift);
        res.status(200).json(shifts);
    } catch (error) {
        next(error);
    }
};

export const getCashierShiftById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const shift = await db.select().from(cashiershift).where(eq(cashiershift.id, id)).limit(1);
        if (!shift.length) {
            res.status(404).json({ message: "Cashier shift not found" });
            return;
        }
        res.status(200).json(shift[0]);
    } catch (error) {
        next(error);
    }
};

export const updateCashierShift = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const { status, totalSaleAmount, totalExpenses, netCashInDrawer } = req.body;
        await db.update(cashiershift).set({
            status,
            totalSaleAmount,
            totalExpenses,
            netCashInDrawer
        }).where(eq(cashiershift.id, id));
        res.status(200).json({ message: "Cashier shift updated successfully" });
    } catch (error) {
        next(error);
    }
};

export const deleteCashierShift = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        await db.delete(cashiershift).where(eq(cashiershift.id, id));
        res.status(200).json({ message: "Cashier shift deleted successfully" });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// 2. LOGIC TRANSLATED FROM MONGOOSE EXAMPLE
// ==========================================

export const  startcashierShift = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const cashierman_id = (req as any).user?.id; 
        const restaurantid = (req as any).user?.restaurantId;
        const { cashier_id } = req.body;

        if (!cashierman_id) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        // ✅ Check if user has an open shift
        const existingShift = await db.select()
            .from(cashiershift)
            .where(and(eq(cashiershift.cashiermanId, cashierman_id), eq(cashiershift.status, "open")))
            .limit(1);

        if (existingShift.length > 0) {
            const cashierDoc = await db.select()
                .from(cashiers)
                .where(eq(cashiers.id, existingShift[0].cashierId))
                .limit(1);

            res.status(200).json({
                message: "You already have an open shift",
                isExisting: true,
                shift: existingShift[0],
                cashier: cashierDoc[0]
            });
            return;
        }

        if (!cashier_id) {
            res.status(400).json({ message: "Cashier ID is required" });
            return;
        }

        // 🔥 Check if the cashier station already has an open shift
        const busyShift = await db.select()
            .from(cashiershift)
            .where(and(eq(cashiershift.cashierId, cashier_id), eq(cashiershift.status, "open")))
            .limit(1);

        if (busyShift.length > 0) {
            res.status(400).json({ message: "Cashier already has an open shift" });
            return;
        }

        // Check if cashier exists and is active
        const cashierDoc = await db.select()
            .from(cashiers)
            .where(and(eq(cashiers.id, cashier_id), eq(cashiers.status, "active")))
            .limit(1);

        if (!cashierDoc.length) {
            res.status(404).json({ message: "Cashier not found" });
            return;
        }

        if (!restaurantid) {
            res.status(400).json({ message: "Restaurant ID is required" });
            return;
        }

        // ✅ Open the shift
        await db.insert(cashiershift).values({
            restaurantid,
            cashiermanId: cashierman_id,
            cashierId: cashier_id,
            status: "open",
            startTime: new Date()
        });

        // ✅ Activate the cashier
        await db.update(cashiers)
            .set({ cashier_active: true })
            .where(eq(cashiers.id, cashier_id));
            
        // Fetch the newly created shift
        const newShift = await db.select()
            .from(cashiershift)
            .where(and(eq(cashiershift.cashiermanId, cashierman_id), eq(cashiershift.status, "open")))
            .limit(1);

        res.status(200).json({
            message: "Cashier shift started successfully",
            shift: newShift[0],
            cashier: cashierDoc[0]
        });
    } catch (error) {
        next(error);
    }
};

export const endshiftcashier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const jwtUser = (req as any).user;
        if (!jwtUser) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const cashierman_id = jwtUser.id;

        const openShifts = await db.select()
            .from(cashiershift)
            .where(and(eq(cashiershift.cashiermanId, cashierman_id), eq(cashiershift.status, "open")))
            .orderBy(desc(cashiershift.startTime))
            .limit(1);

        if (!openShifts.length) {
            res.status(404).json({ message: "Cashier shift not found" });
            return;
        }

        const shift = openShifts[0];

        if (shift.endTime) {
            res.status(400).json({ message: "Shift already ended" });
            return;
        }

        // ✅ Close the shift
        await db.update(cashiershift)
            .set({ 
                status: "closed", 
                endTime: new Date() 
            })
            .where(eq(cashiershift.id, shift.id));

        // ✅ Make the cashier available again
        if (shift.cashierId) {
            await db.update(cashiers)
                .set({ cashier_active: false })
                .where(eq(cashiers.id, shift.cashierId));
        }

        const updatedShift = await db.select().from(cashiershift).where(eq(cashiershift.id, shift.id)).limit(1);

        res.status(200).json({
            message: "Cashier shift ended successfully",
            shift: updatedShift[0],
        });
    } catch (error) {
        next(error);
    }
};

export const endShiftWithReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { password } = req.body;
        const jwtUser = (req as any).user;

        if (!jwtUser) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        
        // 🚨 Note: 
        // 1. Password verification (bcrypt) depends on your specific user setup in Drizzle.
        // 2. Fetching Sales, Expenses, and Payments logic would go here using Drizzle's db.select(), db.execute(), or aggregations.
        // The implementation highly depends on the exact columns of Sale/Payment models which aren't fully exposed.
        // Once those tables are fully translated to Drizzle, you can map the Mongoose aggregation code over using db.execute(sql`...`) or Drizzle ORM syntax.
        
        res.status(501).json({
            message: "endShiftWithReport is not fully implemented yet in Drizzle ORM as it requires Sale/Payment/BankAccount models. Please implement aggregation logic using Drizzle SQL."
        });

    } catch (error) {
        next(error);
    }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        res.status(200).json({
            message: "Logged out successfully"
        });
    } catch (error) {
        next(error);
    }
};
