import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { getAuthUrl } from '@/lib/google-calendar';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback');

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth-token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { payload } = await jwtVerify(token, JWT_SECRET);
        const userId = payload.userId as string;

        if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
            return NextResponse.json({ error: 'Google Calendar não configurado. Configure GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET no .env' }, { status: 500 });
        }

        const url = getAuthUrl(userId);
        return NextResponse.redirect(url);
    } catch (error) {
        console.error('[GCal Auth] Error:', error);
        return NextResponse.json({ error: 'Erro ao iniciar autenticação' }, { status: 500 });
    }
}
