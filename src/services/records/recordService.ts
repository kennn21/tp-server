import { NextFunction, Request, Response } from "express";
import prisma from "../../config/prisma";

const GetAllRecords = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { take, unanalyzed } = req.query;
        const { userId } = req.query;

        let recordsQuery = {};

        if (userId) {
            recordsQuery = {
                userId: Number(userId),
                ...(unanalyzed ? { analyticsId: { equals: 1 } } : {}),
            };
        } else {
            recordsQuery = {
                ...(unanalyzed ? { analyticsId: { equals: 1 } } : {}),
            };
        }

        // Get all records
        const records = await prisma.record.findMany({
            where: recordsQuery,
            orderBy: {
                id: 'desc',
            },
            take: Number(take) || undefined,
            include: {
                media: true,
                analytics: true,
            }
        });

        // Send the records in the response
        res.status(200).json({ data: { records } });
    } catch (e) {
        console.error(e);
        // If an error occurs, return a 500 response
        res.status(500).json({ error: e });
        next(e);
    }
};




const GetOneRecord = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        // Find the record with the specified id
        const record = await prisma.record.findFirst({
            where: {
                id: Number(id),
            },
            include: {
                analytics: true,
                media: true,
            }
        });

        if (!record) {
            // If record is not found, return a 404 response
            res.status(404).json({ error: 'Record not found' });
            return;
        }

        if (record.analyticsId === 1) {
            res.status(200).json({ data: { record, isAnalyzing: true } });
            return;
        }

        // If record is found, return it in the response
        res.status(200).json({ data: { record, isAnalyzing: false } });
    } catch (e) {
        console.error(e);
        // If an error occurs, return a 500 response
        res.status(500).json({ error: e });
        next(e);
    }
};

const GetRecordAnalytics = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        // Find the record with the specified id
        const record = await prisma.record.findFirstOrThrow({
            where: {
                id: Number(id),
            }
        });

        if (record.analyticsId < 2) return res.status(200).json({ data: { isAnalyzing: true } });

        const analytics = await prisma.analytics.findFirstOrThrow({
            where: {
                id: record.analyticsId
            }
        })

        // If record is found, return it in the response
        res.status(200).json({
            data: {
                BikeCount: analytics.BikeCount,
                CarCount: analytics.CarCount,
                TruckCount: analytics.TruckCount,
                BusCount: analytics.BusCount,
                date: record.date,
                isAnalyzing: false,
            }
        });
    } catch (e) {
        console.error(e);
        // If an error occurs, return a 500 response
        res.status(500).json({ error: e });
        next(e);
    }
};

const CreateRecord = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get query
        const { user, mediaId, address, longitude, latitude } = req.body;

        // Create a record related to the media
        const record = await prisma.record.create({
            data: {
                userId: user.id,
                address,
                longitude,
                latitude,
                mediaId,
            },
        });
        if (!record) throw Error('Failed to fetch data');

        // Call the prediction endpoint without waiting for a response
        fetch(`${process.env.BASE_ANALYZER_API_URL}/predict`);

        // Send a success response
        res.status(200).json({ data: { record } });
    } catch (e) {
        console.error(e);
        // Send an error response
        res.status(500).json({ error: e });
        next(e);
    }
};

const DeleteRecord = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get query
        const { id } = req.params;

        // Create a record related to the media
        const record = await prisma.record.delete({
            where: {
                id: Number(id)
            }
        })

        // Send a success response
        res.status(200).json({ data: { record } });
    } catch (e) {
        console.error(e);
        // Send an error response
        res.status(500).json({ error: e });
        next(e);
    }
};

const AttachAnalyticsToRecord = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get query
        const { recordId, analyticsId } = req.body;

        // Update the record with the new analyticsId
        const record = await prisma.record.update({
            where: {
                id: Number(recordId),
            },
            data: {
                analyticsId: Number(analyticsId),
            },
        });

        // Send a success response
        res.status(200).json({ data: { record } });
    } catch (e) {
        console.error(e);
        // Send an error response
        res.status(500).json({ error: e });
        next(e);
    }
};


export { GetAllRecords, GetOneRecord, CreateRecord, AttachAnalyticsToRecord, GetRecordAnalytics, DeleteRecord };