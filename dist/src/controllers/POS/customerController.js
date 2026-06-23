"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCustomer = exports.updateCustomer = exports.getCustomerById = exports.getAllCustomers = exports.createCustomer = void 0;
const connection_1 = require("../../models/connection");
const customer_1 = require("../../models/POS/customer");
const drizzle_orm_1 = require("drizzle-orm");
const createCustomer = async (req, res) => {
    const restaurantid = req.user?.restaurantId;
    const { name, email, phone, address, country, city, customergroupId, totalPointsEarned, isDue, dueAmount } = req.body;
    if (!restaurantid) {
        res.status(401).json({ message: "Unauthorized: No restaurant ID found in token" });
        return;
    }
    await connection_1.db.insert(customer_1.customer).values({
        restaurantid, name, email, phone, address, country, city,
        customergroupId, totalPointsEarned, isDue, dueAmount
    });
    res.status(201).json({ message: "Customer created successfully" });
};
exports.createCustomer = createCustomer;
const getAllCustomers = async (req, res) => {
    const customers = await connection_1.db.select().from(customer_1.customer);
    res.status(200).json(customers);
};
exports.getAllCustomers = getAllCustomers;
const getCustomerById = async (req, res) => {
    const { id } = req.params;
    const cust = await connection_1.db.select().from(customer_1.customer).where((0, drizzle_orm_1.eq)(customer_1.customer.id, id)).limit(1);
    if (!cust.length) {
        res.status(404).json({ message: "Customer not found" });
        return;
    }
    res.status(200).json(cust[0]);
};
exports.getCustomerById = getCustomerById;
const updateCustomer = async (req, res) => {
    const { id } = req.params;
    const { name, email, phone, address, country, city, customergroupId, totalPointsEarned, isDue, dueAmount } = req.body;
    await connection_1.db.update(customer_1.customer).set({
        name, email, phone, address, country, city,
        customergroupId, totalPointsEarned, isDue, dueAmount
    }).where((0, drizzle_orm_1.eq)(customer_1.customer.id, id));
    res.status(200).json({ message: "Customer updated successfully" });
};
exports.updateCustomer = updateCustomer;
const deleteCustomer = async (req, res) => {
    const { id } = req.params;
    await connection_1.db.delete(customer_1.customer).where((0, drizzle_orm_1.eq)(customer_1.customer.id, id));
    res.status(200).json({ message: "Customer deleted successfully" });
};
exports.deleteCustomer = deleteCustomer;
