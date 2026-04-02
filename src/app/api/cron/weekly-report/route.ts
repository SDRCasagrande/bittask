import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWeeklyReport } from "@/lib/weekly-report";

export async function GET(request: Request) {
    // Auth via CRON_SECRET or manual trigger
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const users = await prisma.user.findMany({
            where: { isActive: true },
            select: { id: true, name: true, email: true, notificationEmail: true },
        });

        // Calculate week range
        const now = new Date();
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);

        let sent = 0;
        let errors = 0;

        for (const user of users) {
            try {
                // New clients this week
                const newClients = await prisma.client.count({
                    where: { userId: user.id, createdAt: { gte: weekAgo } },
                });

                // Deals closed this week
                const dealsClosed = await prisma.negotiation.count({
                    where: {
                        client: { userId: user.id },
                        status: { in: ["aprovado", "aceita", "fechado"] },
                        updatedAt: { gte: weekAgo },
                    },
                });

                // Total negotiations this week
                const totalNegs = await prisma.negotiation.count({
                    where: { client: { userId: user.id }, createdAt: { gte: weekAgo } },
                });

                // Pending tasks
                const pendingTasks = await prisma.task.count({
                    where: {
                        OR: [{ createdById: user.id }, { assigneeId: user.id }],
                        completed: false,
                    },
                });

                // TPV (simplified — use latest month)
                const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
                const volumes = await prisma.clientMonth.aggregate({
                    where: { client: { userId: user.id }, month },
                    _sum: { tpvDebit: true, tpvCredit: true, tpvPix: true },
                });
                const tpvTotal = (volumes._sum.tpvDebit || 0) + (volumes._sum.tpvCredit || 0) + (volumes._sum.tpvPix || 0);

                const conversionRate = totalNegs > 0 ? (dealsClosed / totalNegs) * 100 : 0;
                const commission = tpvTotal * 0.0015; // Estimated 0.15% agent commission

                const to = user.notificationEmail || user.email;
                await sendWeeklyReport(to, user.name, {
                    newClients,
                    dealsClosed,
                    conversionRate,
                    tpvTotal,
                    commission,
                    pendingTasks,
                });
                sent++;
            } catch (err) {
                console.error(`Error generating report for ${user.email}:`, err);
                errors++;
            }
        }

        return NextResponse.json({ sent, errors, total: users.length });
    } catch (error) {
        console.error("Cron weekly-report error:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
