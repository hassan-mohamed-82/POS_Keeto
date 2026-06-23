"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteExpenseCategory = exports.updateExpenseCategory = exports.getExpenseCategoryById = exports.getAllExpenseCategories = exports.createExpenseCategory = void 0;
const connection_1 = require("../../models/connection");
const expensscategory_1 = require("../../models/POS/expensscategory");
const drizzle_orm_1 = require("drizzle-orm");
const createExpenseCategory = async (req, res, next) => {
    try {
        const restaurantid = req.user?.restaurantId;
        const { name, arName } = req.body;
        if (!restaurantid) {
            res.status(401).json({ message: "Unauthorized: No restaurant ID found in token" });
            return;
        }
        await connection_1.db.insert(expensscategory_1.expensscategory).values({ restaurantid, name, arName });
        res.status(201).json({ message: "Expense category created successfully" });
    }
    catch (error) {
        next(error);
    }
};
exports.createExpenseCategory = createExpenseCategory;
const getAllExpenseCategories = async (req, res, next) => {
    try {
        const categories = await connection_1.db.select().from(expensscategory_1.expensscategory);
        res.status(200).json(categories);
    }
    catch (error) {
        next(error);
    }
};
exports.getAllExpenseCategories = getAllExpenseCategories;
const getExpenseCategoryById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const category = await connection_1.db.select().from(expensscategory_1.expensscategory).where((0, drizzle_orm_1.eq)(expensscategory_1.expensscategory.id, id));
        if (!category.length) {
            res.status(404).json({ message: "Category not found" });
            return;
        }
        res.status(200).json(category[0]);
    }
    catch (error) {
        next(error);
    }
};
exports.getExpenseCategoryById = getExpenseCategoryById;
const updateExpenseCategory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, arName } = req.body;
        await connection_1.db.update(expensscategory_1.expensscategory).set({ name, arName }).where((0, drizzle_orm_1.eq)(expensscategory_1.expensscategory.id, id));
        res.status(200).json({ message: "Expense category updated successfully" });
    }
    catch (error) {
        next(error);
    }
};
exports.updateExpenseCategory = updateExpenseCategory;
const deleteExpenseCategory = async (req, res, next) => {
    try {
        const { id } = req.params;
        await connection_1.db.delete(expensscategory_1.expensscategory).where((0, drizzle_orm_1.eq)(expensscategory_1.expensscategory.id, id));
        res.status(200).json({ message: "Expense category deleted successfully" });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteExpenseCategory = deleteExpenseCategory;
