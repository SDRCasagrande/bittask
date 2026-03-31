import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback');

export async function POST() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth-token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { payload } = await jwtVerify(token, JWT_SECRET);
        const userId = payload.userId as string;

        await prisma.googleCalendarToken.delete({
            where: { userId },
        }).catch(() => {}); // Ignore if not found

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[GCal Disconnect] Error:', error);
        return NextResponse.json({ error: 'Erro ao desconectar' }, { status: 500 });
    }
}
