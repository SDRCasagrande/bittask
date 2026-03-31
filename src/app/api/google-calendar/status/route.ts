import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { isCalendarConnected } from '@/lib/google-calendar';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback');

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth-token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { payload } = await jwtVerify(token, JWT_SECRET);
        const userId = payload.userId as string;

        const connected = await isCalendarConnected(userId);

        return NextResponse.json({
            connected,
            configured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
        });
    } catch (error) {
        console.error('[GCal Status] Error:', error);
        return NextResponse.json({ connected: false, configured: false }, { status: 500 });
    }
}
