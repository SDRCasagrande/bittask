import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { exchangeCode } from '@/lib/google-calendar';
import { encrypt } from '@/lib/encryption';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://app.bittask.com.br';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');
        const state = searchParams.get('state'); // userId
        const error = searchParams.get('error');

        if (error) {
            console.error('[GCal Callback] User denied access:', error);
            return NextResponse.redirect(`${APP_URL}/dashboard/tarefas?gcal=denied`);
        }

        if (!code || !state) {
            return NextResponse.redirect(`${APP_URL}/dashboard/tarefas?gcal=error`);
        }

        const tokens = await exchangeCode(code);

        if (!tokens.access_token) {
            console.error('[GCal Callback] No access token received');
            return NextResponse.redirect(`${APP_URL}/dashboard/tarefas?gcal=error`);
        }

        // Upsert the token record (encrypted)
        const encAccessToken = encrypt(tokens.access_token);
        const encRefreshToken = encrypt(tokens.refresh_token || '');

        await prisma.googleCalendarToken.upsert({
            where: { userId: state },
            update: {
                accessToken: encAccessToken,
                refreshToken: encRefreshToken,
                expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(Date.now() + 3600 * 1000),
            },
            create: {
                userId: state,
                accessToken: encAccessToken,
                refreshToken: encRefreshToken,
                expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(Date.now() + 3600 * 1000),
            },
        });

        console.log('[GCal Callback] Successfully connected for user:', state);
        return NextResponse.redirect(`${APP_URL}/dashboard/tarefas?gcal=connected`);
    } catch (error) {
        console.error('[GCal Callback] Error:', error);
        return NextResponse.redirect(`${APP_URL}/dashboard/tarefas?gcal=error`);
    }
}

