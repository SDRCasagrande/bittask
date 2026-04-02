import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, isSuperAdmin } from '@/lib/auth';
import { getOrCreateCustomer, createCharge, calculateOrgBilling, currentMonth } from '@/lib/asaas';

// POST /api/billing/generate — Generate monthly billing for all active orgs
// Called by cron or manually by super admin
export async function POST(request: Request) {
    try {
        // Auth: super admin or cron secret
        const session = await getSession();
        const { cronSecret } = await request.json().catch(() => ({}));
        
        if ((!session || !isSuperAdmin(session)) && cronSecret !== process.env.CRON_SECRET) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const BILLING_ENABLED = process.env.BILLING_ENABLED === 'true';
        
        if (!BILLING_ENABLED) {
            return NextResponse.json({ 
                message: 'Billing is disabled. Set BILLING_ENABLED=true to enable.',
                status: 'disabled',
            });
        }

        const month = currentMonth();
        const results: any[] = [];

        // Get all active orgs
        const orgs = await prisma.organization.findMany({
            where: { isActive: true },
            include: { subscriptions: { where: { isActive: true }, include: { product: true } } },
        });

        for (const org of orgs) {
            // Skip if no active subscriptions
            if (org.subscriptions.length === 0) {
                results.push({ org: org.name, status: 'skipped', reason: 'no active subscriptions' });
                continue;
            }

            // Check if billing already exists for this month
            const existing = await prisma.billing.findFirst({
                where: { orgId: org.id, month },
            });
            if (existing) {
                results.push({ org: org.name, status: 'skipped', reason: 'already billed' });
                continue;
            }

            // Calculate billing
            const { baseAmount, overage, totalAmount } = await calculateOrgBilling(org.id, prisma);

            if (totalAmount <= 0) {
                results.push({ org: org.name, status: 'skipped', reason: 'zero amount' });
                continue;
            }

            // Create billing record
            const billing = await prisma.billing.create({
                data: {
                    orgId: org.id,
                    month,
                    baseAmount,
                    overage,
                    totalAmount,
                    status: 'nao_gerado',
                },
            });

            // Create charge in Asaas
            try {
                const customer = await getOrCreateCustomer(org.id, {
                    name: org.name,
                    email: org.email || undefined,
                    cnpj: org.cnpj || undefined,
                    phone: org.phone || undefined,
                });

                const dueDate = `${month}-05`; // Due on 5th of month
                const charge = await createCharge({
                    customerId: customer.id,
                    value: totalAmount,
                    description: `BitTask - ${month} (${org.subscriptions.map(s => s.product.name).join(' + ')})${overage > 0 ? ` + Excedente AI: R$${overage.toFixed(2)}` : ''}`,
                    dueDate,
                    externalReference: billing.id,
                });

                await prisma.billing.update({
                    where: { id: billing.id },
                    data: {
                        status: 'aguardando',
                        asaasId: charge.id,
                        paymentLink: charge.invoiceUrl || '',
                        generatedAt: new Date(),
                    },
                });

                results.push({ org: org.name, status: 'generated', amount: totalAmount, asaasId: charge.id });
            } catch (asaasError) {
                await prisma.billing.update({
                    where: { id: billing.id },
                    data: { status: 'erro' },
                });
                results.push({ org: org.name, status: 'error', error: String(asaasError) });
            }
        }

        return NextResponse.json({ month, results });
    } catch (error) {
        console.error('Billing generate error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

// GET /api/billing/generate — Check billing status
export async function GET() {
    try {
        const session = await getSession();
        if (!session || !isSuperAdmin(session)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const month = currentMonth();
        const billings = await prisma.billing.findMany({
            where: { month },
            include: { org: { select: { name: true, slug: true } } },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ 
            month, 
            billingEnabled: process.env.BILLING_ENABLED === 'true',
            billings,
        });
    } catch (error) {
        console.error('Billing status error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
