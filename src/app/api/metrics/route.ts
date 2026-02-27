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

        // Upcoming renegotiations (60-day deadline from dateAccept)
        const RENEG_DAYS = 60;
        const acceptedNegsAll = await prisma.negotiation.findMany({
            where: { client: { userId: uid }, status: "aceita", dateAccept: { not: "" } },
            include: { client: { select: { id: true, name: true, stoneCode: true } } },
            orderBy: { dateAccept: "asc" },
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcomingRenegotiations = acceptedNegsAll
            .map((neg) => {
                const acceptDate = new Date(neg.dateAccept);
                if (isNaN(acceptDate.getTime())) return null;
                const renegDate = new Date(acceptDate);
                renegDate.setDate(renegDate.getDate() + RENEG_DAYS);
                renegDate.setHours(0, 0, 0, 0);
                const daysLeft = Math.ceil((renegDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                if (daysLeft > 7) return null; // Only show within 7 days
                return {
                    negId: neg.id,
                    clientId: neg.client.id,
                    clientName: neg.client.name,
                    stoneCode: neg.client.stoneCode,
                    dateAccept: neg.dateAccept,
                    renegDate: renegDate.toISOString().split("T")[0],
                    daysLeft,
                };
            })
            .filter(Boolean)
            .sort((a, b) => (a!.daysLeft - b!.daysLeft));

        return NextResponse.json({
            totalClients,
            totalNegotiations,
            pendingNeg,
            acceptedNeg,
            rejectedNeg,
            conversionRate,
            avgRates,
            recentClients,
            upcomingRenegotiations,
        });
    } catch (error) {
        console.error("GET /api/metrics error:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
