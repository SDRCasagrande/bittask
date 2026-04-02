import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ negId: string }> }
) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { negId } = await params;

        const comments = await prisma.negotiationComment.findMany({
            where: { negotiationId: negId },
            include: {
                user: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: "asc" },
        });

        return NextResponse.json(comments);
    } catch (error) {
        console.error("GET /api/negotiations/[negId]/comments error:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ negId: string }> }
) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { negId } = await params;
        const { content } = await request.json();

        if (!content?.trim()) {
            return NextResponse.json({ error: "Content is required" }, { status: 400 });
        }

        const comment = await prisma.negotiationComment.create({
            data: {
                negotiationId: negId,
                userId: session.userId,
                content: content.trim(),
            },
            include: {
                user: { select: { id: true, name: true, email: true } },
            },
        });

        return NextResponse.json(comment, { status: 201 });
    } catch (error) {
        console.error("POST /api/negotiations/[negId]/comments error:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
