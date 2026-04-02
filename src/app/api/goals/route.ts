import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const now = new Date();
        const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

        // Get or create default goal
        let goal = await prisma.userGoal.findUnique({
            where: { userId_month: { userId: session.userId, month } },
        });

        if (!goal) {
            goal = await prisma.userGoal.create({
                data: { userId: session.userId, month },
            });
        }

        // Calculate actual progress
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        // Clients created this month
        const clientsCount = await prisma.client.count({
            where: {
                userId: session.userId,
                createdAt: { gte: monthStart, lte: monthEnd },
            },
        });

        // Deals closed/approved this month
        const dealsCount = await prisma.negotiation.count({
            where: {
                client: { userId: session.userId },
                status: { in: ["aprovado", "aceita", "fechado"] },
                updatedAt: { gte: monthStart, lte: monthEnd },
            },
        });

        // TPV from client months
        const monthStr = month;
        const volumes = await prisma.clientMonth.aggregate({
            where: {
                client: { userId: session.userId },
                month: monthStr,
            },
            _sum: { tpvDebit: true, tpvCredit: true, tpvPix: true },
        });
        const tpvActual = (volumes._sum.tpvDebit || 0) + (volumes._sum.tpvCredit || 0) + (volumes._sum.tpvPix || 0);

        return NextResponse.json({
            month,
            targets: {
                clients: goal.targetClients,
                tpv: goal.targetTPV,
                deals: goal.targetDeals,
            },
            actual: {
                clients: clientsCount,
                tpv: tpvActual,
                deals: dealsCount,
            },
        });
    } catch (error) {
        console.error("GET /api/goals error:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { targetClients, targetTPV, targetDeals } = await request.json();
        const now = new Date();
        const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

        const goal = await prisma.userGoal.upsert({
            where: { userId_month: { userId: session.userId, month } },
            update: {
                ...(targetClients !== undefined && { targetClients }),
                ...(targetTPV !== undefined && { targetTPV }),
                ...(targetDeals !== undefined && { targetDeals }),
            },
            create: {
                userId: session.userId,
                month,
                targetClients: targetClients ?? 10,
                targetTPV: targetTPV ?? 100000,
                targetDeals: targetDeals ?? 15,
            },
        });

        return NextResponse.json(goal);
    } catch (error) {
        console.error("PUT /api/goals error:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
