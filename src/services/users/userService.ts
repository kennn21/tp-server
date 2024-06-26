import { NextFunction, Request, Response } from "express";
import prisma from "../../config/prisma";
import { createUser, findUser } from "./helper/userFunctions";

const loginUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { oauthId, email, name, photoUrl } = req.body;

        if (!oauthId) throw ('No oauth id provided!')

        const user = await prisma.user.findFirst({
            where: {
                oauthId,
            },
            include: {
                profile: true,
            }
        })

        if (!user) {
            const newUser = await createUser(oauthId, { email, name, photoUrl });
            return res.status(200).json({ data: { user: newUser } });
        }

        // If record is found, return it in the response
        res.status(200).json({ data: { user } });
    } catch (error) {
        console.error(error);
        // If an error occurs, return a 500 response
        res.status(500).json({ error });
        next(error);
    }
}

const updateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, name, photoUrl } = req.body;

        const { userId } = req.params;

        const user = await findUser(Number(userId));

        if (!user) {
            throw new Error('User not found');
        }

        const updatedUser = await prisma.user.update({
            where: {
                id: Number(userId),
            },
            data: {
                email,
                name,
                profile: {
                    update: {
                        photoUrl
                    }
                },
            },
            include: {
                profile: true,
            }
        })

        // If record is found, return it in the response
        res.status(200).json({ data: { user: updatedUser } });
    } catch (error) {
        console.error(error);
        // If an error occurs, return a 500 response
        res.status(500).json({ error });
        next(error);
    }
}

export { updateUser, loginUser }