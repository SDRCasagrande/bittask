// BitTask Asaas Integration
// Docs: https://docs.asaas.com/reference

const ASAAS_API_KEY = process.env.ASAAS_API_KEY || '';
const ASAAS_BASE_URL = process.env.ASAAS_SANDBOX === 'true'
    ? 'https://sandbox.asaas.com/api/v3'
    : 'https://api.asaas.com/api/v3';

async function asaasRequest(path: string, options: RequestInit = {}) {
    const res = await fetch(`${ASAAS_BASE_URL}${path}`, {
        ...options,
        headers: {
            'access_token': ASAAS_API_KEY,
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });
    const data = await res.json();
    if (!res.ok) {
        console.error(`Asaas error [${path}]:`, data);
        throw new Error(data.errors?.[0]?.description || 'Asaas API error');
    }
    return data;
}

// ═══ CUSTOMERS ═══

export async function createCustomer(data: {
    name: string;
    email?: string;
    cpfCnpj?: string;
    phone?: string;
    externalReference?: string; // orgId
}) {
    return asaasRequest('/customers', {
        method: 'POST',
        body: JSON.stringify({
            name: data.name,
            email: data.email || undefined,
            cpfCnpj: data.cpfCnpj?.replace(/\D/g, '') || undefined,
            mobilePhone: data.phone?.replace(/\D/g, '') || undefined,
            externalReference: data.externalReference,
            notificationDisabled: false,
        }),
    });
}

export async function findCustomerByRef(externalReference: string) {
    const data = await asaasRequest(`/customers?externalReference=${externalReference}`);
    return data.data?.[0] || null;
}

export async function getOrCreateCustomer(orgId: string, orgData: {
    name: string; email?: string; cnpj?: string; phone?: string;
}) {
    let customer = await findCustomerByRef(orgId);
    if (!customer) {
        customer = await createCustomer({
            name: orgData.name,
            email: orgData.email,
            cpfCnpj: orgData.cnpj,
            phone: orgData.phone,
            externalReference: orgId,
        });
    }
    return customer;
}

// ═══ CHARGES ═══

export async function createCharge(data: {
    customerId: string;
    value: number;
    description: string;
    dueDate: string; // YYYY-MM-DD
    externalReference?: string; // billingId
}) {
    return asaasRequest('/payments', {
        method: 'POST',
        body: JSON.stringify({
            customer: data.customerId,
            billingType: 'UNDEFINED', // Allows PIX, boleto, credit card
            value: data.value,
            description: data.description,
            dueDate: data.dueDate,
            externalReference: data.externalReference,
        }),
    });
}

export async function getPayment(paymentId: string) {
    return asaasRequest(`/payments/${paymentId}`);
}

export async function getPaymentPixQrCode(paymentId: string) {
    return asaasRequest(`/payments/${paymentId}/pixQrCode`);
}

// ═══ BILLING HELPERS ═══

/**
 * Calculate prorated amount based on remaining days in month
 */
export function calculateProrated(monthlyPrice: number, startDate: Date): number {
    const daysInMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate();
    const remainingDays = daysInMonth - startDate.getDate() + 1;
    return parseFloat(((monthlyPrice / daysInMonth) * remainingDays).toFixed(2));
}

/**
 * Get current billing month string (YYYY-MM)
 */
export function currentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Calculate total billing for an org based on active subscriptions
 */
export async function calculateOrgBilling(orgId: string, prisma: any) {
    const subs = await prisma.orgSubscription.findMany({
        where: { orgId, isActive: true },
        include: { product: true },
    });

    const baseAmount = subs.reduce((sum: number, s: any) => sum + s.product.monthlyPrice, 0);

    // Get AI overage from previous month
    const prevMonth = getPreviousMonth();
    const aiUsage = await prisma.aiUsage.findMany({
        where: { orgId, month: prevMonth },
    });
    const totalAiRequests = aiUsage.reduce((sum: number, u: any) => sum + u.count, 0);
    const AI_INCLUDED = 500;
    const AI_OVERAGE_PRICE = 0.10;
    const overage = totalAiRequests > AI_INCLUDED
        ? parseFloat(((totalAiRequests - AI_INCLUDED) * AI_OVERAGE_PRICE).toFixed(2))
        : 0;

    return { baseAmount, overage, totalAmount: baseAmount + overage };
}

function getPreviousMonth(): string {
    const now = new Date();
    now.setMonth(now.getMonth() - 1);
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}
