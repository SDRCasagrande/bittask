import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/billing/webhook — Asaas payment webhook
export async function POST(request: Request) {
    try {
        // Validate webhook token
        const webhookToken = process.env.ASAAS_WEBHOOK_TOKEN;
        const authHeader = request.headers.get('asaas-access-token');
        
        if (webhookToken && authHeader !== webhookToken) {
            return NextResponse.json({ error: 'Invalid webhook token' }, { status: 401 });
        }

        const body = await request.json();
        const { event, payment } = body;

        if (!payment?.externalReference) {
            return NextResponse.json({ ok: true, message: 'No external reference' });
        }

        const billingId = payment.externalReference;

        // Find billing record
        const billing = await prisma.billing.findUnique({ where: { id: billingId } });
        if (!billing) {
            console.warn(`Webhook: billing not found for ID ${billingId}`);
            return NextResponse.json({ ok: true, message: 'Billing not found' });
        }

        switch (event) {
            case 'PAYMENT_RECEIVED':
            case 'PAYMENT_CONFIRMED':
                await prisma.billing.update({
                    where: { id: billingId },
                    data: {
                        status: 'pago',
                        paidAt: new Date(payment.paymentDate || Date.now()),
                    },
                });
                console.log(`✅ Billing ${billingId} marked as paid`);
                break;

            case 'PAYMENT_OVERDUE':
                await prisma.billing.update({
                    where: { id: billingId },
                    data: { status: 'atrasado' },
                });
                console.log(`⚠️ Billing ${billingId} is overdue`);
                break;

            case 'PAYMENT_DELETED':
            case 'PAYMENT_REFUNDED':
                await prisma.billing.update({
                    where: { id: billingId },
                    data: { status: 'cancelado' },
                });
                console.log(`❌ Billing ${billingId} cancelled/refunded`);
                break;

            default:
                console.log(`Webhook event ignored: ${event}`);
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('Billing webhook error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
