import { resend, FROM_EMAIL } from "./resend";

interface WeeklyMetrics {
    newClients: number;
    dealsClosed: number;
    conversionRate: number;
    tpvTotal: number;
    commission: number;
    pendingTasks: number;
}

export function generateWeeklyReportHTML(userName: string, metrics: WeeklyMetrics): string {
    const fmtMoney = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        
        <!-- Logo -->
        <tr><td align="center" style="padding-bottom:24px;">
          <div style="display:inline-block;background:#10b981;color:white;font-weight:900;font-size:20px;width:48px;height:48px;line-height:48px;text-align:center;border-radius:14px;">BT</div>
        </td></tr>

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#10b981,#059669);border-radius:16px 16px 0 0;padding:28px 32px;text-align:center;">
          <div style="font-size:36px;margin-bottom:8px;">📊</div>
          <h1 style="margin:0;color:white;font-size:22px;font-weight:700;">Briefing Diário</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Resumo dos últimos 7 dias no BitTask</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#1e293b;padding:32px;border-radius:0 0 16px 16px;">
          
          <p style="color:#e2e8f0;font-size:16px;margin:0 0 24px;line-height:1.5;">
            Olá <strong style="color:white;">${userName}</strong> 👋
          </p>

          <!-- Metrics Grid -->
          <table width="100%" cellpadding="0" cellspacing="8" style="margin-bottom:24px;">
            <tr>
              <td style="background:#0f172a;border-radius:12px;padding:16px;text-align:center;width:50%;">
                <div style="font-size:28px;font-weight:900;color:#10b981;">${metrics.newClients}</div>
                <div style="font-size:11px;color:#94a3b8;text-transform:uppercase;font-weight:600;letter-spacing:1px;margin-top:4px;">Novos Clientes</div>
              </td>
              <td style="background:#0f172a;border-radius:12px;padding:16px;text-align:center;width:50%;">
                <div style="font-size:28px;font-weight:900;color:#6366f1;">${metrics.dealsClosed}</div>
                <div style="font-size:11px;color:#94a3b8;text-transform:uppercase;font-weight:600;letter-spacing:1px;margin-top:4px;">Deals Fechados</div>
              </td>
            </tr>
            <tr>
              <td style="background:#0f172a;border-radius:12px;padding:16px;text-align:center;width:50%;">
                <div style="font-size:28px;font-weight:900;color:#f59e0b;">${metrics.conversionRate.toFixed(1)}%</div>
                <div style="font-size:11px;color:#94a3b8;text-transform:uppercase;font-weight:600;letter-spacing:1px;margin-top:4px;">Conversão</div>
              </td>
              <td style="background:#0f172a;border-radius:12px;padding:16px;text-align:center;width:50%;">
                <div style="font-size:28px;font-weight:900;color:#10b981;">${fmtMoney(metrics.commission)}</div>
                <div style="font-size:11px;color:#94a3b8;text-transform:uppercase;font-weight:600;letter-spacing:1px;margin-top:4px;">Comissão Est.</div>
              </td>
            </tr>
          </table>

          <!-- TPV highlight -->
          <div style="background:linear-gradient(135deg,#1e3a2f,#0f2419);border:1px solid #10b981;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
            <div style="font-size:11px;color:#10b981;text-transform:uppercase;font-weight:600;letter-spacing:1px;">TPV Total da Semana</div>
            <div style="font-size:32px;font-weight:900;color:white;margin-top:4px;">${fmtMoney(metrics.tpvTotal)}</div>
          </div>

          ${metrics.pendingTasks > 0 ? `
          <div style="background:#451a03;border:1px solid #78350f;border-radius:12px;padding:14px 16px;margin-bottom:24px;">
            <p style="color:#fde68a;font-size:14px;margin:0;line-height:1.5;">
              📋 Você tem <strong>${metrics.pendingTasks} tarefa(s) pendente(s)</strong>. Não esqueça de verificar!
            </p>
          </div>` : ""}

          <!-- CTA Button -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding-top:8px;">
              <a href="https://app.bittask.com.br/dashboard" 
                 style="display:inline-block;background:#10b981;color:white;text-decoration:none;padding:14px 32px;border-radius:12px;font-size:15px;font-weight:700;">
                Acessar Dashboard →
              </a>
            </td></tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding-top:24px;text-align:center;">
          <p style="color:#475569;font-size:12px;margin:0;">BitTask — Gestão Inteligente de Negociações & Propostas</p>
          <p style="color:#334155;font-size:11px;margin:8px 0 0;">Briefing diário automático — todo dia às 8h.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendWeeklyReport(to: string, userName: string, metrics: WeeklyMetrics) {
    if (!resend) {
        console.warn("Resend not configured, skipping weekly report");
        return null;
    }

    const html = generateWeeklyReportHTML(userName, metrics);

    try {
        const result = await resend.emails.send({
            from: FROM_EMAIL,
            to,
            subject: `📊 Seu briefing diário — BitTask`,
            html,
        });
        console.log(`Weekly report sent to ${to}:`, result);
        return result;
    } catch (error) {
        console.error(`Failed to send weekly report to ${to}:`, error);
        return null;
    }
}
