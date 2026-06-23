"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllExpensesscategory = exports.deleteExpense = exports.updateExpense = exports.getExpenseById = exports.getAllExpenses = exports.createExpense = void 0;
const connection_1 = require("../../models/connection");
const expenss_1 = require("../../models/POS/expenss");
const drizzle_orm_1 = require("drizzle-orm");
const schema_1 = require("../../models/schema");
const response_1 = require("../../utils/response");
const Errors_1 = require("../../Errors");
const createExpense = async (req, res) => {
    const restaurantid = req.user?.restaurantId;
    const { name, amount, categoryId, shiftId, cashierId, cashiermanId, note, paymentmethodId } = req.body;
    if (!restaurantid) {
        throw new Errors_1.UnauthorizedError("Unauthorized: No restaurant ID found in token");
    }
    await connection_1.db.insert(expenss_1.expenss).values({
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
    return (0, response_1.SuccessResponse)(res, { message: "Expense created successfully" });
};
exports.createExpense = createExpense;
const getAllExpenses = async (req, res) => {
    const expenses = await connection_1.db.select().from(expenss_1.expenss);
    return (0, response_1.SuccessResponse)(res, { message: "Expenses fetched successfully", data: expenses });
};
exports.getAllExpenses = getAllExpenses;
const getExpenseById = async (req, res) => {
    const { id } = req.params;
    const expense = await connection_1.db.select().from(expenss_1.expenss).where((0, drizzle_orm_1.eq)(expenss_1.expenss.id, id));
    if (!expense.length) {
        res.status(404).json({ message: "Expense not found" });
        return;
    }
    return (0, response_1.SuccessResponse)(res, { message: "Expense fetched successfully", data: expense[0] });
};
exports.getExpenseById = getExpenseById;
const updateExpense = async (req, res) => {
    const { id } = req.params;
    const { name, amount, categoryId, shiftId, cashierId, cashiermanId, note, paymentmethodId } = req.body;
    await connection_1.db.update(expenss_1.expenss).set({
        name,
        amount,
        categoryId,
        shiftId,
        cashierId,
        cashiermanId,
        note,
        paymentmethodId
    }).where((0, drizzle_orm_1.eq)(expenss_1.expenss.id, id));
    return (0, response_1.SuccessResponse)(res, { message: "Expense updated successfully" });
};
exports.updateExpense = updateExpense;
const deleteExpense = async (req, res) => {
    const { id } = req.params;
    await connection_1.db.delete(expenss_1.expenss).where((0, drizzle_orm_1.eq)(expenss_1.expenss.id, id));
    return (0, response_1.SuccessResponse)(res, { message: "Expense deleted successfully" });
};
exports.deleteExpense = deleteExpense;
const getAllExpensesscategory = async (req, res) => {
    const expenses = await connection_1.db.select().from(schema_1.expensscategory);
    return (0, response_1.SuccessResponse)(res, { message: "Expense category fetched successfully", data: expenses });
};
exports.getAllExpensesscategory = getAllExpensesscategory;
