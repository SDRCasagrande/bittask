import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// PUT — update a negotiation
export async function PUT(request: Request, { params }: { params: Promise<{ id: string; negId: string }> }) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const { id, negId } = await params;

        const clientWhere: any = { id };
        if (session.orgId) clientWhere.orgId = session.orgId;
        else clientWhere.userId = session.userId;
        const client = await prisma.client.findFirst({ where: clientWhere });
        if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const existing = await prisma.negotiation.findUnique({ where: { id: negId } });
        if (!existing || existing.clientId !== id) return NextResponse.json({ error: "Negotiation not found" }, { status: 404 });

        const body = await request.json();
        const updated = await prisma.negotiation.update({
            where: { id: negId },
            data: {
                ...(body.dateNeg !== undefined && { dateNeg: body.dateNeg }),
                ...(body.status !== undefined && { status: body.status }),
                ...(body.rates !== undefined && { rates: body.rates }),
                ...(body.notes !== undefined && { notes: body.notes }),
                ...(body.alertDate !== undefined && { alertDate: body.alertDate }),
            },
            include: { assignee: { select: { id: true, name: true, email: true } } },
        });
        return NextResponse.json(updated);
    } catch (error) {
        console.error("PUT negotiation error:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

// DELETE — delete a negotiation (with TPV link validation)
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string; negId: string }> }) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const { id, negId } = await params;

        const clientWhere: any = { id };
        if (session.orgId) clientWhere.orgId = session.orgId;
        else clientWhere.userId = session.userId;
        const client = await prisma.client.findFirst({ where: clientWhere });
        if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const existing = await prisma.negotiation.findUnique({ where: { id: negId } });
        if (!existing || existing.clientId !== id) return NextResponse.json({ error: "Negotiation not found" }, { status: 404 });

        // Check if any TPV month is linked (saved with these rates)
        // A month is "linked" if it was saved after this negotiation and before the next one
        const allNegs = await prisma.negotiation.findMany({
            where: { clientId: id },
            orderBy: { createdAt: "desc" },
        });
        
        const negIndex = allNegs.findIndex(n => n.id === negId);
        const isOnlyNeg = allNegs.length === 1;
        const isLatest = negIndex === 0;

        // If it's the only negotiation and there are TPV records, block deletion
        if (isOnlyNeg) {
            const tpvCount = await prisma.clientMonth.count({ where: { clientId: id } });
            if (tpvCount > 0) {
                return NextResponse.json({ 
                    error: "linked", 
                    message: `Esta é a única negociação e existem ${tpvCount} TPV(s) vinculado(s). Exclua os TPVs primeiro.` 
                }, { status: 409 });
            }
        }

        // If it's the latest negotiation but there are TPVs, warn
        if (isLatest && !isOnlyNeg) {
            const tpvCount = await prisma.clientMonth.count({ where: { clientId: id } });
            if (tpvCount > 0) {
                // Allow but warn — TPVs already have rates baked in
            }
        }

        // Delete linked tasks first
        await prisma.task.deleteMany({ where: { negotiationId: negId } });

        await prisma.negotiation.delete({ where: { id: negId } });
        return NextResponse.json({ success: true, deleted: negId });
    } catch (error) {
        console.error("DELETE negotiation error:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
