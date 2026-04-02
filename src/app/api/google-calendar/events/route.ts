import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { listCalendarEvents } from '@/lib/google-calendar';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback');

export async function GET(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth-token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { payload } = await jwtVerify(token, JWT_SECRET);
        const userId = payload.userId as string;

        const url = new URL(req.url);
        const timeMin = url.searchParams.get('timeMin') || new Date().toISOString();
        const timeMax = url.searchParams.get('timeMax') || new Date(Date.now() + 30 * 86400000).toISOString();

        const events = await listCalendarEvents(userId, timeMin, timeMax);

        return NextResponse.json({ events });
    } catch (error) {
        console.error('[GCal Events] Error:', error);
        return NextResponse.json({ events: [] }, { status: 500 });
    }
}
