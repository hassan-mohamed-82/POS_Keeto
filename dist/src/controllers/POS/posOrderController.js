"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getShiftCompletedSales = exports.getPosPendingById = exports.getPosPending = exports.payDueSale = exports.getDueSales = exports.cancelSale = exports.getSaleById = exports.getAllSales = exports.createSale = void 0;
const connection_1 = require("../../models/connection");
const orderpos_1 = require("../../models/POS/orderpos");
const cashiershift_1 = require("../../models/POS/cashiershift");
const restrauntadmin_1 = require("../../models/admin/restrauntadmin");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("../../utils/response");
const Errors_1 = require("../../Errors");
const bcrypt_1 = __importDefault(require("bcrypt")); // using bcrypt as in package.json
// 1. createSale
const createSale = async (req, res, next) => {
    try {
        const restaurantId = req.user?.restaurantId;
        const cashiermanId = req.user?.id;
        const userBranchId = req.user?.branchId;
        if (!restaurantId || !cashiermanId)
            throw new Errors_1.UnauthorizedError("Unauthorized");
        const { branchId, customerId, dueCustomerId, isDue, remainingAmount, cashierId, shiftId, accountId, discountId, orderStatus, note, subtotal, taxRate, taxAmount, discountAmount, grandTotal, paidAmount, items, // array of items
        payments // array of payments
         } = req.body;
        // Generate reference (MMDDxxxx)
        const now = new Date();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        const randomPart = Math.floor(1000 + Math.random() * 9000);
        const reference = `${month}${day}${randomPart}`;
        let createdSaleId = "";
        await connection_1.db.transaction(async (tx) => {
            // 1. Insert Sale
            await tx.insert(orderpos_1.posSales).values({
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
            const insertedSale = await tx.select().from(orderpos_1.posSales).where((0, drizzle_orm_1.eq)(orderpos_1.posSales.reference, reference)).limit(1);
            if (!insertedSale.length)
                throw new Error("Failed to retrieve created sale");
            createdSaleId = insertedSale[0].id;
            // 2. Insert Items
            if (items && items.length > 0) {
                const itemsToInsert = items.map((item) => ({
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
                await tx.insert(orderpos_1.posSaleItems).values(itemsToInsert);
            }
            // 3. Insert Payments
            if (payments && payments.length > 0) {
                const paymentsToInsert = payments.map((payment) => ({
                    saleId: createdSaleId,
                    accountId: payment.accountId,
                    amount: payment.amount,
                    status: payment.status || "completed",
                    paymentProof: payment.paymentProof
                }));
                await tx.insert(orderpos_1.posPayments).values(paymentsToInsert);
            }
        });
        res.status(201).json({ message: "Sale created successfully", data: { id: createdSaleId, reference } });
    }
    catch (error) {
        next(error);
    }
};
exports.createSale = createSale;
// 2. getAllSales
const getAllSales = async (req, res, next) => {
    try {
        const restaurantId = req.user?.restaurantId;
        const branchId = req.user?.branchId;
        if (!restaurantId)
            throw new Errors_1.UnauthorizedError("Unauthorized");
        const conditions = [(0, drizzle_orm_1.eq)(orderpos_1.posSales.restaurantId, restaurantId)];
        if (branchId)
            conditions.push((0, drizzle_orm_1.eq)(orderpos_1.posSales.branchId, branchId));
        const sales = await connection_1.db.select().from(orderpos_1.posSales).where((0, drizzle_orm_1.and)(...conditions));
        (0, response_1.SuccessResponse)(res, sales);
    }
    catch (error) {
        next(error);
    }
};
exports.getAllSales = getAllSales;
// 3. getSaleById
const getSaleById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const restaurantId = req.user?.restaurantId;
        const branchId = req.user?.branchId;
        if (!restaurantId)
            throw new Errors_1.UnauthorizedError("Unauthorized");
        const conditions = [(0, drizzle_orm_1.eq)(orderpos_1.posSales.id, id), (0, drizzle_orm_1.eq)(orderpos_1.posSales.restaurantId, restaurantId)];
        if (branchId)
            conditions.push((0, drizzle_orm_1.eq)(orderpos_1.posSales.branchId, branchId));
        const sale = await connection_1.db.select().from(orderpos_1.posSales).where((0, drizzle_orm_1.and)(...conditions)).limit(1);
        if (!sale.length)
            throw new Errors_1.NotFound("Sale not found");
        const items = await connection_1.db.select().from(orderpos_1.posSaleItems).where((0, drizzle_orm_1.eq)(orderpos_1.posSaleItems.saleId, id));
        const payments = await connection_1.db.select().from(orderpos_1.posPayments).where((0, drizzle_orm_1.eq)(orderpos_1.posPayments.saleId, id));
        (0, response_1.SuccessResponse)(res, { ...sale[0], items, payments });
    }
    catch (error) {
        next(error);
    }
};
exports.getSaleById = getSaleById;
// 4. cancelSale
const cancelSale = async (req, res, next) => {
    try {
        const { id } = req.params;
        const restaurantId = req.user?.restaurantId;
        const branchId = req.user?.branchId;
        if (!restaurantId)
            throw new Errors_1.UnauthorizedError("Unauthorized");
        const conditions = [(0, drizzle_orm_1.eq)(orderpos_1.posSales.id, id), (0, drizzle_orm_1.eq)(orderpos_1.posSales.restaurantId, restaurantId)];
        if (branchId)
            conditions.push((0, drizzle_orm_1.eq)(orderpos_1.posSales.branchId, branchId));
        await connection_1.db.update(orderpos_1.posSales).set({ orderStatus: "cancelled" }).where((0, drizzle_orm_1.and)(...conditions));
        (0, response_1.SuccessResponse)(res, { message: "Sale cancelled successfully" });
    }
    catch (error) {
        next(error);
    }
};
exports.cancelSale = cancelSale;
// 5. getDueSales
const getDueSales = async (req, res, next) => {
    try {
        const restaurantId = req.user?.restaurantId;
        const branchId = req.user?.branchId;
        if (!restaurantId)
            throw new Errors_1.UnauthorizedError("Unauthorized");
        const conditions = [(0, drizzle_orm_1.eq)(orderpos_1.posSales.restaurantId, restaurantId), (0, drizzle_orm_1.eq)(orderpos_1.posSales.isDue, true)];
        if (branchId)
            conditions.push((0, drizzle_orm_1.eq)(orderpos_1.posSales.branchId, branchId));
        const dueSales = await connection_1.db.select().from(orderpos_1.posSales).where((0, drizzle_orm_1.and)(...conditions));
        (0, response_1.SuccessResponse)(res, dueSales);
    }
    catch (error) {
        next(error);
    }
};
exports.getDueSales = getDueSales;
// 6. payDueSale
const payDueSale = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { amount, accountId, paymentProof } = req.body;
        const restaurantId = req.user?.restaurantId;
        const branchId = req.user?.branchId;
        if (!restaurantId)
            throw new Errors_1.UnauthorizedError("Unauthorized");
        await connection_1.db.transaction(async (tx) => {
            const conditions = [(0, drizzle_orm_1.eq)(orderpos_1.posSales.id, id), (0, drizzle_orm_1.eq)(orderpos_1.posSales.restaurantId, restaurantId)];
            if (branchId)
                conditions.push((0, drizzle_orm_1.eq)(orderpos_1.posSales.branchId, branchId));
            const sale = await tx.select().from(orderpos_1.posSales).where((0, drizzle_orm_1.and)(...conditions)).limit(1);
            if (!sale.length)
                throw new Errors_1.NotFound("Sale not found");
            if (!sale[0].isDue)
                throw new Errors_1.BadRequest("Sale is not a due sale");
            const newPaidAmount = Number(sale[0].paidAmount) + Number(amount);
            const newRemainingAmount = Math.max(0, Number(sale[0].grandTotal) - newPaidAmount);
            await tx.insert(orderpos_1.posPayments).values({
                saleId: id,
                accountId,
                amount: amount.toString(),
                status: "completed",
                paymentProof
            });
            await tx.update(orderpos_1.posSales).set({
                paidAmount: newPaidAmount.toString(),
                remainingAmount: newRemainingAmount.toString(),
                isDue: newRemainingAmount > 0
            }).where((0, drizzle_orm_1.eq)(orderpos_1.posSales.id, id));
        });
        (0, response_1.SuccessResponse)(res, { message: "Payment added successfully" });
    }
    catch (error) {
        next(error);
    }
};
exports.payDueSale = payDueSale;
// 7. getPosPending
const getPosPending = async (req, res, next) => {
    try {
        const restaurantId = req.user?.restaurantId;
        const branchId = req.user?.branchId;
        if (!restaurantId)
            throw new Errors_1.UnauthorizedError("Unauthorized");
        const conditions = [(0, drizzle_orm_1.eq)(orderpos_1.posSales.restaurantId, restaurantId), (0, drizzle_orm_1.eq)(orderpos_1.posSales.orderStatus, "pending")];
        if (branchId)
            conditions.push((0, drizzle_orm_1.eq)(orderpos_1.posSales.branchId, branchId));
        const pendingSales = await connection_1.db.select().from(orderpos_1.posSales).where((0, drizzle_orm_1.and)(...conditions));
        (0, response_1.SuccessResponse)(res, pendingSales);
    }
    catch (error) {
        next(error);
    }
};
exports.getPosPending = getPosPending;
// 8. getPosPendingById
const getPosPendingById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const restaurantId = req.user?.restaurantId;
        const branchId = req.user?.branchId;
        if (!restaurantId)
            throw new Errors_1.UnauthorizedError("Unauthorized");
        const conditions = [
            (0, drizzle_orm_1.eq)(orderpos_1.posSales.id, id),
            (0, drizzle_orm_1.eq)(orderpos_1.posSales.restaurantId, restaurantId),
            (0, drizzle_orm_1.eq)(orderpos_1.posSales.orderStatus, "pending")
        ];
        if (branchId)
            conditions.push((0, drizzle_orm_1.eq)(orderpos_1.posSales.branchId, branchId));
        const sale = await connection_1.db.select().from(orderpos_1.posSales).where((0, drizzle_orm_1.and)(...conditions)).limit(1);
        if (!sale.length)
            throw new Errors_1.NotFound("Pending sale not found");
        const items = await connection_1.db.select().from(orderpos_1.posSaleItems).where((0, drizzle_orm_1.eq)(orderpos_1.posSaleItems.saleId, id));
        const payments = await connection_1.db.select().from(orderpos_1.posPayments).where((0, drizzle_orm_1.eq)(orderpos_1.posPayments.saleId, id));
        (0, response_1.SuccessResponse)(res, { ...sale[0], items, payments });
    }
    catch (error) {
        next(error);
    }
};
exports.getPosPendingById = getPosPendingById;
// 9. getShiftCompletedSales
const getShiftCompletedSales = async (req, res, next) => {
    try {
        const { password } = req.body;
        const jwtUser = req.user;
        if (!jwtUser)
            throw new Errors_1.UnauthorizedError("Unauthorized");
        const userId = jwtUser.id;
        // 1) Get User for password comparison
        const user = await connection_1.db.select().from(restrauntadmin_1.restrauntadmin).where((0, drizzle_orm_1.eq)(restrauntadmin_1.restrauntadmin.id, userId)).limit(1);
        if (!user.length)
            throw new Errors_1.NotFound("User not found");
        const fakePassword = process.env.SHIFT_REPORT_PASSWORD;
        let mode = null;
        if (password && (await bcrypt_1.default.compare(password, user[0].password))) {
            mode = "real";
        }
        else if (fakePassword && password === fakePassword) {
            mode = "fake";
        }
        if (!mode)
            throw new Errors_1.BadRequest("Wrong password");
        // 2) Last open shift
        const shift = await connection_1.db.select()
            .from(cashiershift_1.cashiershift)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(cashiershift_1.cashiershift.cashiermanId, userId), (0, drizzle_orm_1.eq)(cashiershift_1.cashiershift.status, "open")))
            .orderBy((0, drizzle_orm_1.desc)(cashiershift_1.cashiershift.startTime))
            .limit(1);
        if (!shift.length)
            throw new Errors_1.NotFound("No open cashier shift found");
        // 3) Completed sales in this shift
        // We will do a basic implementation and improve with joins if needed
        const sales = await connection_1.db.select().from(orderpos_1.posSales)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(orderpos_1.posSales.shiftId, shift[0].id), (0, drizzle_orm_1.eq)(orderpos_1.posSales.cashierId, shift[0].cashierId), (0, drizzle_orm_1.eq)(orderpos_1.posSales.orderStatus, "completed")));
        if (!sales.length) {
            (0, response_1.SuccessResponse)(res, {
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
        let items = [];
        if (saleIds.length > 0) {
            items = await connection_1.db.select().from(orderpos_1.posSaleItems).where((0, drizzle_orm_1.sql) `${orderpos_1.posSaleItems.saleId} IN ${saleIds}`);
        }
        const itemsBySaleId = {};
        for (const item of items) {
            const key = item.saleId;
            if (!itemsBySaleId[key])
                itemsBySaleId[key] = [];
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
            (0, response_1.SuccessResponse)(res, {
                message: "Completed sales sample for current shift",
                shift: shift[0],
                total_sales_in_shift: totalCount,
                sampled_percentage: 20,
                sales: sampledSales,
            });
            return;
        }
        // 5) Real mode
        (0, response_1.SuccessResponse)(res, {
            message: "Completed sales for current shift",
            shift: shift[0],
            sales: salesWithItems,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getShiftCompletedSales = getShiftCompletedSales;
