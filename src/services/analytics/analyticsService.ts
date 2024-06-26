import { NextFunction, Request, Response } from "express";
import prisma from "../../config/prisma";

const GetAllAnalytics = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId } = req.query;

        // Get all records for the given userId
        const records = await prisma.record.findMany({
            where: {
                AND: [
                    {
                        userId: Number(userId),
                    },
                    {
                        analyticsId: {
                            not: 1,
                        }
                    }
                ]
            },
        });

        // Fetch analytics for each record
        const analyticsPromises = records.map(async (record) => {
            return prisma.analytics.findMany({
                where: {
                    id: record.analyticsId,
                },
            });
        });

        // Wait for all analytics to be fetched
        const analyticsArrays = await Promise.all(analyticsPromises);

        // Merge all analytics arrays into a single array
        const analytics = analyticsArrays.flat();

        // Send the analytics in the response
        res.status(200).json({ data: { analytics } });
    } catch (e) {
        console.error(e);
        // If an error occurs, return a 500 response
        res.status(500).json({ error: e });
        next(e);
    }
};



const GetOneAnalytics = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        // Get one analytics record
        const analytics = await prisma.analytics.findFirstOrThrow({
            where: {
                id: Number(id)
            }
        });

        // Send the analytics in the response
        res.status(200).json({ data: { analytics } });
    } catch (e) {
        console.error(e);
        // If an error occurs, return a 500 response
        res.status(500).json({ error: e });
        next(e);
    }
};

const CreateAnalytics = async (req: Request, res: Response, next: NextFunction) => {
    try {
        //Get query
        const { bikeCount, carCount, truckCount, busCount, decision } = req.body;

        // Create an analytics record
        const analytics = await prisma.analytics.create({
            data: {
                CarCount: carCount,
                BikeCount: bikeCount,
                TruckCount: truckCount,
                BusCount: busCount,
                decision,
            },
        });

        // Send the created analytics record in the response
        res.status(200).json({ data: { analytics } });
    } catch (e) {
        console.error(e);
        // If an error occurs, return a 500 response
        res.status(500).json({ error: e });
        next(e);
    }
};

// Get analytics grouped monthly for data visualization purposes
const GetAnalyticsData = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId } = req.body;

        const records = await prisma.record.findMany({
            where: {
                user: {
                    id: userId
                },
                analyticsId: {
                    not: 1,
                },
            },
            select: {
                date: true,
                analyticsId: true
            }
        });

        // Group records by month
        const groupedRecords = records.reduce((acc: any, curr) => {
            const month = curr.date.getMonth() + 1;
            const year = curr.date.getFullYear();
            const key = `${year}-${month.toString().padStart(2, '0')}`;

            if (!acc[key]) {
                acc[key] = [];
            }

            acc[key].push(curr.analyticsId);

            return acc;
        }, {});

        // Get analytics for each month
        const monthlyAnalytics = await Promise.all(
            Object.entries(groupedRecords).map(async ([date, analyticsIds]) => {
                const analytics = await prisma.analytics.findMany({
                    where: {
                        id: {
                            //@ts-ignore
                            in: analyticsIds
                        },
                    },
                    select: {
                        CarCount: true,
                        BikeCount: true,
                        TruckCount: true,
                        BusCount: true,
                    }
                });

                return {
                    date: new Date(date),
                    CarCount: analytics.reduce((sum, { CarCount }) => sum + CarCount, 0),
                    BikeCount: analytics.reduce((sum, { BikeCount }) => sum + BikeCount, 0),
                    TruckCount: analytics.reduce((sum, { TruckCount }) => sum + TruckCount, 0),
                    BusCount: analytics.reduce((sum, { BusCount }) => sum + BusCount, 0),
                };
            })
        );

        // Send the monthly analytics in the response
        res.status(200).json({ data: { monthlyAnalytics } });
    } catch (e) {
        console.error(e);
        // If an error occurs, return a 500 response
        res.status(500).json({ error: e });
        next(e);
    }
};

const GetAllTimeCount = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId } = req.params;

        const records = await prisma.record.findMany({
            where: {
                user: {
                    id: Number(userId)
                }
            },
            select: {
                analyticsId: true
            }
        });

        if (!records) {
            return res.status(200).json({
                data: {
                    car: 0,
                    bike: 0,
                    truck: 0,
                    bus: 0,
                }
            });
        }

        // Get all analytics IDs
        const allAnalyticsIds = records.map(record => record.analyticsId);

        // Get all analytics except analytics with ID 1
        const allAnalytics = await prisma.analytics.findMany({
            where: {
                id: {
                    in: allAnalyticsIds.filter(id => id !== 1)
                }
            },
            select: {
                CarCount: true,
                BikeCount: true,
                TruckCount: true,
                BusCount: true,
            }
        });

        if (!allAnalytics) {
            return res.status(200).json({
                data: {
                    car: 0,
                    bike: 0,
                    truck: 0,
                    bus: 0,
                }
            });
        }

        // Calculate the total counts
        const car = allAnalytics.reduce((sum, { CarCount }) => sum + CarCount, 0);
        const bike = allAnalytics.reduce((sum, { BikeCount }) => sum + BikeCount, 0);
        const truck = allAnalytics.reduce((sum, { TruckCount }) => sum + TruckCount, 0);
        const bus = allAnalytics.reduce((sum, { BusCount }) => sum + BusCount, 0);

        // Send the total counts in the response
        res.status(200).json({
            data: {
                car,
                bike,
                truck,
                bus,
            }
        });
    } catch (e) {
        console.error(e);
        // If an error occurs, return a 500 response
        res.status(500).json({ error: e });
        next(e);
    }

};

export { GetAllAnalytics, GetOneAnalytics, GetAnalyticsData, CreateAnalytics, GetAllTimeCount }