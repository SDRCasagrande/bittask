import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET all task lists with tasks for current user
export async function GET() {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const lists = await prisma.taskList.findMany({
            where: { userId: session.userId },
            include: {
                tasks: {
                    include: {
                        assignee: { select: { id: true, name: true, email: true } },
                        createdBy: { select: { id: true, name: true } },
                    },
                    orderBy: { createdAt: 'asc' },
                },
            },
            orderBy: { createdAt: 'asc' },
        });

        // Also include tasks assigned TO this user from other lists
        const assignedTasks = await prisma.task.findMany({
            where: { assigneeId: session.userId, list: { userId: { not: session.userId } } },
            include: {
                assignee: { select: { id: true, name: true, email: true } },
                createdBy: { select: { id: true, name: true } },
                list: { select: { name: true } },
            },
        });

        return NextResponse.json({ lists, assignedTasks });
    } catch (error) {
        console.error('GET /api/tasks error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

// POST create new task list
export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { name } = await request.json();
        if (!name?.trim()) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });

        const list = await prisma.taskList.create({
            data: { name: name.trim(), userId: session.userId },
            include: { tasks: true },
        });

        return NextResponse.json(list, { status: 201 });
    } catch (error) {
        console.error('POST /api/tasks error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
