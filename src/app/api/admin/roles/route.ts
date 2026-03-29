import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET all roles with permissions
export async function GET() {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const roles = await prisma.role.findMany({
            include: { permissions: true, _count: { select: { users: true } } },
            orderBy: { createdAt: 'asc' },
        });

        return NextResponse.json(roles);
    } catch (error) {
        console.error('GET /api/admin/roles error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

// POST create new role
export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { name, description, permissions } = await request.json();

        if (!name?.trim()) {
            return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
        }

        const role = await prisma.role.create({
            data: {
                name: name.trim(),
                description: description?.trim() || '',
                permissions: {
                    create: (permissions || []).map((p: string) => ({ permission: p })),
                },
            },
            include: { permissions: true },
        });

        return NextResponse.json(role, { status: 201 });
    } catch (error: any) {
        if (error?.code === 'P2002') {
            return NextResponse.json({ error: 'Já existe um cargo com esse nome' }, { status: 409 });
        }
        console.error('POST /api/admin/roles error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
