import { Router } from "express";
import {
    createExpenseCategory,
    getAllExpenseCategories,
    getExpenseCategoryById,
    updateExpenseCategory,
    deleteExpenseCategory
} from "../../controllers/POS/expenseCategoryController";

const router = Router();

router.post("/", createExpenseCategory);
router.get("/", getAllExpenseCategories);
router.get("/:id", getExpenseCategoryById);
router.put("/:id", updateExpenseCategory);
router.delete("/:id", deleteExpenseCategory);

export default router;
