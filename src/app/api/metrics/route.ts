import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const uid = session.userId;

        // Counts
        const totalClients = await prisma.client.count({ where: { userId: uid } });
        const totalNegotiations = await prisma.negotiation.count({
            where: { client: { userId: uid } },
        });
        const pendingNeg = await prisma.negotiation.count({
            where: { client: { userId: uid }, status: "pendente" },
        });
        const acceptedNeg = await prisma.negotiation.count({
            where: { client: { userId: uid }, status: "aceita" },
        });
        const rejectedNeg = await prisma.negotiation.count({
            where: { client: { userId: uid }, status: "recusada" },
        });

        // Conversion rate
        const conversionRate = totalNegotiations > 0 ? (acceptedNeg / totalNegotiations) * 100 : 0;

        // Average rates from accepted negotiations
        const acceptedNegs = await prisma.negotiation.findMany({
            where: { client: { userId: uid }, status: "aceita" },
            select: { rates: true },
        });

        let avgRates = { debit: 0, credit1x: 0, credit2to6: 0, credit7to12: 0, pix: 0, rav: 0 };
        if (acceptedNegs.length > 0) {
            const sum = { debit: 0, credit1x: 0, credit2to6: 0, credit7to12: 0, pix: 0, rav: 0 };
            for (const n of acceptedNegs) {
                const r = n.rates as Record<string, number>;
                sum.debit += r.debit || 0;
                sum.credit1x += r.credit1x || 0;
                sum.credit2to6 += r.credit2to6 || 0;
                sum.credit7to12 += r.credit7to12 || 0;
                sum.pix += r.pix || 0;
                sum.rav += r.rav || 0;
            }
            const count = acceptedNegs.length;
            avgRates = {
                debit: sum.debit / count,
                credit1x: sum.credit1x / count,
                credit2to6: sum.credit2to6 / count,
                credit7to12: sum.credit7to12 / count,
                pix: sum.pix / count,
                rav: sum.rav / count,
            };
        }

        // Recent clients
        const recentClients = await prisma.client.findMany({
            where: { userId: uid },
            include: { negotiations: { orderBy: { createdAt: "desc" }, take: 1 } },
            orderBy: { createdAt: "desc" },
            take: 5,
        });

        return NextResponse.json({
            totalClients,
            totalNegotiations,
            pendingNeg,
            acceptedNeg,
            rejectedNeg,
            conversionRate,
            avgRates,
            recentClients,
        });
    } catch (error) {
        console.error("GET /api/metrics error:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
