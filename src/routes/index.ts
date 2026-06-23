import { Router } from "express";
import expenseCategoryRoutes from "./POS/expenseCategory";
import expenseRoutes from "./POS/expense";
import cashierShiftRoutes from "./POS/cashiershift";
import customerGroupRoutes from "./POS/customerGroup";
import customerRoutes from "./POS/customer";
import posHomeRoutes from "./POS/posHome";

const route = Router();

route.use("/expense-categories", expenseCategoryRoutes);
route.use("/expenses", expenseRoutes);
route.use("/cashier-shifts", cashierShiftRoutes);
route.use("/customer-groups", customerGroupRoutes);
route.use("/customers", customerRoutes);
route.use("/pos-home", posHomeRoutes);

export default route;