import { Request, Response } from "express";
import { db } from "../../models/connection";
import { customer } from "../../models/POS/customer";
import { eq } from "drizzle-orm";

export const createCustomer = async (req: Request, res: Response) => {
    const restaurantid = (req as any).user?.restaurantId;
    const { name, email, phone, address, country, city, customergroupId, totalPointsEarned, isDue, dueAmount } = req.body;
    if (!restaurantid) {
        res.status(401).json({ message: "Unauthorized: No restaurant ID found in token" });
        return;
    }
    await db.insert(customer).values({
        restaurantid, name, email, phone, address, country, city,
        customergroupId, totalPointsEarned, isDue, dueAmount
    });
    res.status(201).json({ message: "Customer created successfully" });
};

export const getAllCustomers = async (req: Request, res: Response) => {
    const customers = await db.select().from(customer);
    res.status(200).json(customers);
};

export const getCustomerById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const cust = await db.select().from(customer).where(eq(customer.id, id)).limit(1);
    if (!cust.length) {
        res.status(404).json({ message: "Customer not found" });
        return;
    }
    res.status(200).json(cust[0]);
};

export const updateCustomer = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, email, phone, address, country, city, customergroupId, totalPointsEarned, isDue, dueAmount } = req.body;
    await db.update(customer).set({
        name, email, phone, address, country, city,
        customergroupId, totalPointsEarned, isDue, dueAmount
    }).where(eq(customer.id, id));
    res.status(200).json({ message: "Customer updated successfully" });
};

export const deleteCustomer = async (req: Request, res: Response) => {
    const { id } = req.params;
    await db.delete(customer).where(eq(customer.id, id));
    res.status(200).json({ message: "Customer deleted successfully" });
};
