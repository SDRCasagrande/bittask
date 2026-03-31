import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { exchangeCode } from '@/lib/google-calendar';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');
        const state = searchParams.get('state'); // userId
        const error = searchParams.get('error');

        if (error) {
            console.error('[GCal Callback] User denied access:', error);
            return NextResponse.redirect(new URL('/dashboard/configuracoes?gcal=denied', request.url));
        }

        if (!code || !state) {
            return NextResponse.redirect(new URL('/dashboard/configuracoes?gcal=error', request.url));
        }

        const tokens = await exchangeCode(code);

        if (!tokens.access_token) {
            console.error('[GCal Callback] No access token received');
            return NextResponse.redirect(new URL('/dashboard/configuracoes?gcal=error', request.url));
        }

        // Upsert the token record
        await prisma.googleCalendarToken.upsert({
            where: { userId: state },
            update: {
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token || '',
                expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(Date.now() + 3600 * 1000),
            },
            create: {
                userId: state,
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token || '',
                expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(Date.now() + 3600 * 1000),
            },
        });

        console.log('[GCal Callback] Successfully connected for user:', state);
        return NextResponse.redirect(new URL('/dashboard/configuracoes?gcal=connected', request.url));
    } catch (error) {
        console.error('[GCal Callback] Error:', error);
        return NextResponse.redirect(new URL('/dashboard/configuracoes?gcal=error', request.url));
    }
}
