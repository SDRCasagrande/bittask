import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(request: Request, { params }: { params: Promise<{ negId: string }> }) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const { negId } = await params;

        const body = await request.json();
        const { title, date } = body;

        let list = await prisma.taskList.findFirst({
            where: { userId: session.userId }
        });
        if (!list) {
            list = await prisma.taskList.create({
                data: { name: "Minhas Tarefas", userId: session.userId, orgId: session.orgId || null }
            });
        }

        const task = await prisma.task.create({
            data: {
                listId: list.id,
                title: title.trim(),
                description: "Tarefa vinculada à negociação.",
                date: date || "",
                time: "",
                assigneeId: session.userId,
                createdById: session.userId,
                priority: "medium",
                negotiationId: negId
            }
        });

        return NextResponse.json(task, { status: 201 });
    } catch (error) {
        console.error("POST negotiations tasks error:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
