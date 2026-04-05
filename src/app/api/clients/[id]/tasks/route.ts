import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// POST add pure task to client (Despachar)
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const { id } = await params;

        // Verify ownership (org-level or user-level)
        const clientWhere: any = { id };
        if (session.orgId) clientWhere.orgId = session.orgId;
        else clientWhere.userId = session.userId;
        const client = await prisma.client.findFirst({ where: clientWhere });
        if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const { title, description, date, assigneeId, priority } = await request.json();
        
        if (!title) return NextResponse.json({ error: "Título obrigatório" }, { status: 400 });

        // Find or create a default list for the current user
        let list = await prisma.taskList.findFirst({
            where: { userId: session.userId },
            orderBy: { createdAt: "asc" },
        });
        if (!list) {
            list = await prisma.taskList.create({
                data: { name: "Minhas Tarefas", userId: session.userId, orgId: session.orgId || null },
            });
        }

        const task = await prisma.task.create({
            data: {
                title,
                description: description || `Cliente: ${client.name}\n${client.stoneCode ? 'Stone Code: ' + client.stoneCode : ''}`,
                date: date || "",
                time: "",
                priority: priority || "medium",
                listId: list.id,
                createdById: session.userId,
                assigneeId: assigneeId || null,
                clientId: client.id,
            },
        });

        return NextResponse.json(task, { status: 201 });
    } catch (error) {
        console.error("POST client task error:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
