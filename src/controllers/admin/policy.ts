import { Request, Response } from "express";
import { db } from "../../models/connection";
import { policy } from "../../models/schema";
import { eq,and } from "drizzle-orm";
import { SuccessResponse } from "../../utils/response";
import { BadRequest } from "../../Errors";
import { saveBase64Image } from "../../utils/handleImages";

export const createKetoPolicy = async ( req: Request,res: Response) => {

    const { title, description } = req.body;

    if (!title || !description) {
        throw new BadRequest(
            "Missing required fields"
        );
    }

    const [newPolicy] = await db
        .insert(policy)
        .values({

            title,

            description,

            type: "keto",

            restaurantId: null,
        });

    return SuccessResponse(res, {
        data: newPolicy,
    });
};

export const updateKetoPolicy = async (req: Request, res: Response) => {

    const { id } = req.params;

    const { title, description } = req.body;

    await db
        .update(policy)
        .set({

            title,

            description,

            updatedAt: new Date(),
        })
        .where(
            and(
                eq(policy.id, id),
                eq(policy.type, "keto")
            )
        );

    return SuccessResponse(res, {
        message: "Keto policy updated",
    });
};

export const getKetoPolicies = async ( req: Request,res: Response) => {

    const policies = await db
        .select()
        .from(policy)
        .where(eq(policy.type, "keto"));

    return SuccessResponse(res, {
        data: policies,
    });
};


export const deleteKetoPolicy = async (req: Request,res: Response) => {

    const { id } = req.params;

    await db
        .delete(policy)
        .where(
            and(
                eq(policy.id, id),
                eq(policy.type, "keto")
            )
        );

    return SuccessResponse(res, {
        message: "Keto policy deleted",
    });
};

export const getKetoPoliciesById = async (req: Request,res: Response) => {

    const { id } = req.params;

    const policies = await db
        .select()
        .from(policy)
        .where(eq(policy.id, id));

    return SuccessResponse(res, {
        data: policies,
    });
};