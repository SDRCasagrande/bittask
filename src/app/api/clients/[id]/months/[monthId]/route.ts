import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// PUT — update a specific month record
export async function PUT(request: Request, { params }: { params: Promise<{ id: string; monthId: string }> }) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const { id, monthId } = await params;

        const client = await prisma.client.findUnique({ where: { id } });
        if (!client || client.userId !== session.userId) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const existing = await prisma.clientMonth.findUnique({ where: { id: monthId } });
        if (!existing || existing.clientId !== id) return NextResponse.json({ error: "Month record not found" }, { status: 404 });

        const body = await request.json();
        const { tpvDebit, tpvCredit, tpvPix, brandBreakdown } = body;

        const record = await prisma.clientMonth.update({
            where: { id: monthId },
            data: {
                ...(tpvDebit !== undefined && { tpvDebit }),
                ...(tpvCredit !== undefined && { tpvCredit }),
                ...(tpvPix !== undefined && { tpvPix }),
                ...(brandBreakdown !== undefined && { brandBreakdown }),
            },
        });

        return NextResponse.json(record);
    } catch (error) {
        console.error("PUT month error:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

// DELETE — delete a specific month record
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string; monthId: string }> }) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const { id, monthId } = await params;

        const client = await prisma.client.findUnique({ where: { id } });
        if (!client || client.userId !== session.userId) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const existing = await prisma.clientMonth.findUnique({ where: { id: monthId } });
        if (!existing || existing.clientId !== id) return NextResponse.json({ error: "Month record not found" }, { status: 404 });

        await prisma.clientMonth.delete({ where: { id: monthId } });

        return NextResponse.json({ success: true, deleted: monthId });
    } catch (error) {
        console.error("DELETE month error:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
