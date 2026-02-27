import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

const SEED_KEY = process.env.SEED_KEY || 'bitkaiser-seed-2026';

const USERS = [
    { name: 'Eliel', email: 'eliel@casa94.com' },
    { name: 'Mateus', email: 'mateus@casa94.com' },
    { name: 'Luciana', email: 'luciana@casa94.com' },
    { name: 'Nayane', email: 'nayane@casa94.com' },
    { name: 'José', email: 'jose@casa94.com' },
    { name: 'Wilson', email: 'wilson@casa94.com' },
];

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (key !== SEED_KEY) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const defaultPassword = await bcrypt.hash('Stone-001', 12);
    const results = [];

    for (const user of USERS) {
        const result = await prisma.user.upsert({
            where: { email: user.email },
            update: {},
            create: {
                name: user.name,
                email: user.email,
                password: defaultPassword,
            },
        });
        results.push({ id: result.id, name: result.name, email: result.email });
    }

    return NextResponse.json({ seeded: results.length, users: results });
}
