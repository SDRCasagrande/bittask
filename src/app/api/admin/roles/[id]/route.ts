import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// PUT update role
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const { name, description, permissions } = await request.json();

        // Delete old permissions and create new ones
        await prisma.rolePermission.deleteMany({ where: { roleId: id } });

        const role = await prisma.role.update({
            where: { id },
            data: {
                ...(name?.trim() ? { name: name.trim() } : {}),
                ...(description !== undefined ? { description: description.trim() } : {}),
                permissions: {
                    create: (permissions || []).map((p: string) => ({ permission: p })),
                },
            },
            include: { permissions: true, _count: { select: { users: true } } },
        });

        return NextResponse.json(role);
    } catch (error: any) {
        if (error?.code === 'P2002') {
            return NextResponse.json({ error: 'Já existe um cargo com esse nome' }, { status: 409 });
        }
        console.error('PUT /api/admin/roles error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

// DELETE role (only if no users assigned)
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;

        const userCount = await prisma.user.count({ where: { roleId: id } });
        if (userCount > 0) {
            return NextResponse.json({ error: `Não é possível excluir — ${userCount} usuário(s) vinculado(s)` }, { status: 409 });
        }

        await prisma.role.delete({ where: { id } });
        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('DELETE /api/admin/roles error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
