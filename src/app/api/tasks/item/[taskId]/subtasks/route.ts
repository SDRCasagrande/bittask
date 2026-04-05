import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET subtasks for a task
export async function GET(_: Request, { params }: { params: Promise<{ taskId: string }> }) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { taskId } = await params;

        const subtasks = await prisma.subTask.findMany({
            where: { taskId },
            orderBy: { order: 'asc' },
        });

        return NextResponse.json(subtasks);
    } catch (error) {
        console.error('GET subtasks error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

// POST create a subtask
export async function POST(request: Request, { params }: { params: Promise<{ taskId: string }> }) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { taskId } = await params;
        const { title } = await request.json();

        if (!title?.trim()) return NextResponse.json({ error: 'Título obrigatório' }, { status: 400 });

        // Get max order
        const maxOrder = await prisma.subTask.findFirst({
            where: { taskId },
            orderBy: { order: 'desc' },
            select: { order: true },
        });

        const subtask = await prisma.subTask.create({
            data: {
                title: title.trim(),
                taskId,
                order: (maxOrder?.order ?? -1) + 1,
            },
        });

        return NextResponse.json(subtask, { status: 201 });
    } catch (error) {
        console.error('POST subtask error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

// PUT toggle/update a subtask (pass subtaskId in body)
export async function PUT(request: Request, { params }: { params: Promise<{ taskId: string }> }) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { subtaskId, completed, title } = await request.json();
        if (!subtaskId) return NextResponse.json({ error: 'subtaskId obrigatório' }, { status: 400 });

        const data: any = {};
        if (completed !== undefined) data.completed = completed;
        if (title !== undefined) data.title = title.trim();

        const subtask = await prisma.subTask.update({
            where: { id: subtaskId },
            data,
        });

        return NextResponse.json(subtask);
    } catch (error) {
        console.error('PUT subtask error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

// DELETE a subtask (pass subtaskId in body)
export async function DELETE(request: Request, { params }: { params: Promise<{ taskId: string }> }) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { subtaskId } = await request.json();
        if (!subtaskId) return NextResponse.json({ error: 'subtaskId obrigatório' }, { status: 400 });

        await prisma.subTask.delete({ where: { id: subtaskId } });

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('DELETE subtask error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
