import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// DELETE a task list
export async function DELETE(_: Request, { params }: { params: Promise<{ listId: string }> }) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { listId } = await params;

        const list = await prisma.taskList.findFirst({ where: { id: listId, userId: session.userId } });
        if (!list) return NextResponse.json({ error: 'Lista não encontrada' }, { status: 404 });

        await prisma.taskList.delete({ where: { id: listId } });
        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('DELETE /api/tasks/[listId] error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
