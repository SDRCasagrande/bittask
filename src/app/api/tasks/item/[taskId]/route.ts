import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// PUT update a task (toggle complete, star, reschedule, reassign)
export async function PUT(request: Request, { params }: { params: Promise<{ taskId: string }> }) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { taskId } = await params;
        const body = await request.json();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data: any = {};
        if (body.completed !== undefined) data.completed = body.completed;
        if (body.starred !== undefined) data.starred = body.starred;
        if (body.scheduled !== undefined) data.scheduled = body.scheduled;
        if (body.title !== undefined) data.title = body.title.trim();
        if (body.description !== undefined) data.description = body.description;
        if (body.priority !== undefined) data.priority = body.priority;
        if (body.date !== undefined) data.date = body.date;
        if (body.time !== undefined) data.time = body.time;
        if (body.assigneeId !== undefined) data.assigneeId = body.assigneeId || null;

        const task = await prisma.task.update({
            where: { id: taskId },
            data,
            include: {
                assignee: { select: { id: true, name: true, email: true } },
                createdBy: { select: { id: true, name: true } },
            },
        });

        return NextResponse.json(task);
    } catch (error) {
        console.error('PUT /api/tasks/item/[taskId] error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

// DELETE a task
export async function DELETE(_: Request, { params }: { params: Promise<{ taskId: string }> }) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { taskId } = await params;
        await prisma.task.delete({ where: { id: taskId } });
        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('DELETE /api/tasks/item/[taskId] error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
