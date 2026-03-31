import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// GET /api/metrics/activity — Painel de Controle (Stone-style)
// Query params: period=today|week|month|custom, from=YYYY-MM-DD, to=YYYY-MM-DD
export async function GET(request: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const uid = session.userId;
        const { searchParams } = new URL(request.url);
        const period = searchParams.get("period") || "month";
        const customFrom = searchParams.get("from");
        const customTo = searchParams.get("to");

        // Calculate date range
        const now = new Date();
        let fromDate: Date;
        let toDate: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

        switch (period) {
            case "today":
                fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
                break;
            case "week":
                fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 0, 0, 0);
                break;
            case "month":
                fromDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
                break;
            case "custom":
                fromDate = customFrom ? new Date(customFrom + "T00:00:00") : new Date(now.getFullYear(), now.getMonth(), 1);
                toDate = customTo ? new Date(customTo + "T23:59:59") : toDate;
                break;
            default:
                fromDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        }

        // New clients in period
        const newClients = await prisma.client.findMany({
            where: { userId: uid, createdAt: { gte: fromDate, lte: toDate } },
            select: { id: true, name: true, stoneCode: true, brand: true, safra: true, status: true, createdAt: true, cnpj: true },
            orderBy: { createdAt: "desc" },
        });

        // New active (credentialed) in period
        const fromStr = fromDate.toISOString().split("T")[0];
        const toStr = toDate.toISOString().split("T")[0];
        const allClientsWithCred = await prisma.client.findMany({
            where: { userId: uid, status: "ativo", credentialDate: { not: "" } },
            select: { id: true, name: true, stoneCode: true, brand: true, safra: true, credentialDate: true, createdAt: true, cnpj: true },
        });
        const newActives = allClientsWithCred.filter(c => c.credentialDate >= fromStr && c.credentialDate <= toStr);

        // Negotiations in period
        const negsInPeriod = await prisma.negotiation.findMany({
            where: { client: { userId: uid }, createdAt: { gte: fromDate, lte: toDate } },
            select: { id: true, status: true, dateNeg: true, dateAccept: true, rates: true, createdAt: true, client: { select: { id: true, name: true, stoneCode: true, brand: true } } },
            orderBy: { createdAt: "desc" },
        });

        // Proposals sent in period (proposta_enviada, pendente, or any neg created with rates)
        const proposals = negsInPeriod.filter(n => ["proposta_enviada", "pendente", "aguardando_cliente"].includes(n.status) || n.status === "prospeccao");
        const approved = negsInPeriod.filter(n => ["aprovado", "aceita", "fechado"].includes(n.status));
        const rejected = negsInPeriod.filter(n => ["recusado", "recusada"].includes(n.status));

        // Tasks created in period
        let tasksCreated = 0;
        let tasksCompleted = 0;
        try {
            tasksCreated = await prisma.task.count({
                where: { OR: [{ createdById: uid }, { assigneeId: uid }], createdAt: { gte: fromDate, lte: toDate } },
            });
            tasksCompleted = await prisma.task.count({
                where: { OR: [{ createdById: uid }, { assigneeId: uid }], completed: true, updatedAt: { gte: fromDate, lte: toDate } },
            });
        } catch { /* */ }

        // Build summary counters
        const summary = {
            newClients: newClients.length,
            newActives: newActives.length,
            newProposals: proposals.length,
            approved: approved.length,
            rejected: rejected.length,
            totalNegotiations: negsInPeriod.length,
            tasksCreated,
            tasksCompleted,
        };

        return NextResponse.json({
            period,
            from: fromDate.toISOString().split("T")[0],
            to: toDate.toISOString().split("T")[0],
            summary,
            newClients: newClients.slice(0, 20),
            newActives: newActives.slice(0, 20),
            proposals: proposals.slice(0, 20).map(n => ({
                id: n.id, status: n.status, dateNeg: n.dateNeg,
                clientName: n.client.name, clientStoneCode: n.client.stoneCode, brand: n.client.brand,
                createdAt: n.createdAt,
            })),
            approved: approved.slice(0, 20).map(n => ({
                id: n.id, status: n.status, dateAccept: n.dateAccept,
                clientName: n.client.name, clientStoneCode: n.client.stoneCode, brand: n.client.brand,
                createdAt: n.createdAt,
            })),
        });
    } catch (error) {
        console.error("GET /api/metrics/activity error:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
