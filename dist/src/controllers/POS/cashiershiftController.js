"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.endShiftWithReport = exports.endshiftcashier = exports.startcashierShift = exports.deleteCashierShift = exports.updateCashierShift = exports.getCashierShiftById = exports.getAllCashierShifts = exports.createCashierShift = void 0;
const connection_1 = require("../../models/connection");
const cashiershift_1 = require("../../models/POS/cashiershift");
const cashier_1 = require("../../models/POS/cashier");
const drizzle_orm_1 = require("drizzle-orm");
// ==========================================
// 1. STANDARD CRUD
// ==========================================
const createCashierShift = async (req, res, next) => {
    try {
        const restaurantid = req.user?.restaurantId;
        const { cashiermanId, cashierId, status, totalSaleAmount, totalExpenses, netCashInDrawer } = req.body;
        if (!restaurantid) {
            res.status(401).json({ message: "Unauthorized: No restaurant ID found in token" });
            return;
        }
        await connection_1.db.insert(cashiershift_1.cashiershift).values({
            restaurantid,
            cashiermanId,
            cashierId,
            status,
            totalSaleAmount,
            totalExpenses,
            netCashInDrawer
        });
        res.status(201).json({ message: "Cashier shift created successfully" });
    }
    catch (error) {
        next(error);
    }
};
exports.createCashierShift = createCashierShift;
const getAllCashierShifts = async (req, res, next) => {
    try {
        const shifts = await connection_1.db.select().from(cashiershift_1.cashiershift);
        res.status(200).json(shifts);
    }
    catch (error) {
        next(error);
    }
};
exports.getAllCashierShifts = getAllCashierShifts;
const getCashierShiftById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const shift = await connection_1.db.select().from(cashiershift_1.cashiershift).where((0, drizzle_orm_1.eq)(cashiershift_1.cashiershift.id, id)).limit(1);
        if (!shift.length) {
            res.status(404).json({ message: "Cashier shift not found" });
            return;
        }
        res.status(200).json(shift[0]);
    }
    catch (error) {
        next(error);
    }
};
exports.getCashierShiftById = getCashierShiftById;
const updateCashierShift = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, totalSaleAmount, totalExpenses, netCashInDrawer } = req.body;
        await connection_1.db.update(cashiershift_1.cashiershift).set({
            status,
            totalSaleAmount,
            totalExpenses,
            netCashInDrawer
        }).where((0, drizzle_orm_1.eq)(cashiershift_1.cashiershift.id, id));
        res.status(200).json({ message: "Cashier shift updated successfully" });
    }
    catch (error) {
        next(error);
    }
};
exports.updateCashierShift = updateCashierShift;
const deleteCashierShift = async (req, res, next) => {
    try {
        const { id } = req.params;
        await connection_1.db.delete(cashiershift_1.cashiershift).where((0, drizzle_orm_1.eq)(cashiershift_1.cashiershift.id, id));
        res.status(200).json({ message: "Cashier shift deleted successfully" });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteCashierShift = deleteCashierShift;
// ==========================================
// 2. LOGIC TRANSLATED FROM MONGOOSE EXAMPLE
// ==========================================
const startcashierShift = async (req, res, next) => {
    try {
        const cashierman_id = req.user?.id;
        const restaurantid = req.user?.restaurantId;
        const { cashier_id } = req.body;
        if (!cashierman_id) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        // ✅ Check if user has an open shift
        const existingShift = await connection_1.db.select()
            .from(cashiershift_1.cashiershift)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(cashiershift_1.cashiershift.cashiermanId, cashierman_id), (0, drizzle_orm_1.eq)(cashiershift_1.cashiershift.status, "open")))
            .limit(1);
        if (existingShift.length > 0) {
            const cashierDoc = await connection_1.db.select()
                .from(cashier_1.cashiers)
                .where((0, drizzle_orm_1.eq)(cashier_1.cashiers.id, existingShift[0].cashierId))
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
        const busyShift = await connection_1.db.select()
            .from(cashiershift_1.cashiershift)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(cashiershift_1.cashiershift.cashierId, cashier_id), (0, drizzle_orm_1.eq)(cashiershift_1.cashiershift.status, "open")))
            .limit(1);
        if (busyShift.length > 0) {
            res.status(400).json({ message: "Cashier already has an open shift" });
            return;
        }
        // Check if cashier exists and is active
        const cashierDoc = await connection_1.db.select()
            .from(cashier_1.cashiers)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(cashier_1.cashiers.id, cashier_id), (0, drizzle_orm_1.eq)(cashier_1.cashiers.status, "active")))
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
        await connection_1.db.insert(cashiershift_1.cashiershift).values({
            restaurantid,
            cashiermanId: cashierman_id,
            cashierId: cashier_id,
            status: "open",
            startTime: new Date()
        });
        // ✅ Activate the cashier
        await connection_1.db.update(cashier_1.cashiers)
            .set({ cashier_active: true })
            .where((0, drizzle_orm_1.eq)(cashier_1.cashiers.id, cashier_id));
        // Fetch the newly created shift
        const newShift = await connection_1.db.select()
            .from(cashiershift_1.cashiershift)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(cashiershift_1.cashiershift.cashiermanId, cashierman_id), (0, drizzle_orm_1.eq)(cashiershift_1.cashiershift.status, "open")))
            .limit(1);
        res.status(200).json({
            message: "Cashier shift started successfully",
            shift: newShift[0],
            cashier: cashierDoc[0]
        });
    }
    catch (error) {
        next(error);
    }
};
exports.startcashierShift = startcashierShift;
const endshiftcashier = async (req, res, next) => {
    try {
        const jwtUser = req.user;
        if (!jwtUser) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const cashierman_id = jwtUser.id;
        const openShifts = await connection_1.db.select()
            .from(cashiershift_1.cashiershift)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(cashiershift_1.cashiershift.cashiermanId, cashierman_id), (0, drizzle_orm_1.eq)(cashiershift_1.cashiershift.status, "open")))
            .orderBy((0, drizzle_orm_1.desc)(cashiershift_1.cashiershift.startTime))
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
        await connection_1.db.update(cashiershift_1.cashiershift)
            .set({
            status: "closed",
            endTime: new Date()
        })
            .where((0, drizzle_orm_1.eq)(cashiershift_1.cashiershift.id, shift.id));
        // ✅ Make the cashier available again
        if (shift.cashierId) {
            await connection_1.db.update(cashier_1.cashiers)
                .set({ cashier_active: false })
                .where((0, drizzle_orm_1.eq)(cashier_1.cashiers.id, shift.cashierId));
        }
        const updatedShift = await connection_1.db.select().from(cashiershift_1.cashiershift).where((0, drizzle_orm_1.eq)(cashiershift_1.cashiershift.id, shift.id)).limit(1);
        res.status(200).json({
            message: "Cashier shift ended successfully",
            shift: updatedShift[0],
        });
    }
    catch (error) {
        next(error);
    }
};
exports.endshiftcashier = endshiftcashier;
const endShiftWithReport = async (req, res, next) => {
    try {
        const { password } = req.body;
        const jwtUser = req.user;
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
    }
    catch (error) {
        next(error);
    }
};
exports.endShiftWithReport = endShiftWithReport;
const logout = async (req, res, next) => {
    try {
        res.status(200).json({
            message: "Logged out successfully"
        });
    }
    catch (error) {
        next(error);
    }
};
exports.logout = logout;
