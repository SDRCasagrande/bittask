import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { createCalendarEvent } from '@/lib/google-calendar';

// POST create a task inside a list
export async function POST(request: Request, { params }: { params: Promise<{ listId: string }> }) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { listId } = await params;
        const { title, date, time, assigneeId, description, priority } = await request.json();

        if (!title?.trim()) return NextResponse.json({ error: 'Título é obrigatório' }, { status: 400 });

        const list = await prisma.taskList.findFirst({ where: { id: listId, userId: session.userId } });
        if (!list) return NextResponse.json({ error: 'Lista não encontrada' }, { status: 404 });

        const task = await prisma.task.create({
            data: {
                title: title.trim(),
                description: description || '',
                date: date || '',
                time: time || '',
                priority: priority || 'medium',
                listId,
                createdById: session.userId,
                assigneeId: assigneeId || null,
            },
            include: {
                assignee: { select: { id: true, name: true, email: true } },
                createdBy: { select: { id: true, name: true } },
            },
        });

        // Google Calendar sync — create event if user is connected and task has a date
        if (date) {
            try {
                const eventId = await createCalendarEvent(session.userId, {
                    title: title.trim(),
                    description: description || '',
                    date,
                    time: time || undefined,
                });
                if (eventId) {
                    await prisma.task.update({
                        where: { id: task.id },
                        data: { googleCalendarEventId: eventId, scheduled: true },
                    });
                }
            } catch (gcalError) {
                console.error('[GCal] Error creating event (non-blocking):', gcalError);
                // Non-blocking: task was created successfully, calendar sync just failed
            }
        }

        return NextResponse.json(task, { status: 201 });
    } catch (error) {
        console.error('POST /api/tasks/[listId]/items error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
