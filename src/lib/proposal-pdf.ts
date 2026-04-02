import jsPDF from "jspdf";
import "jspdf-autotable";

interface BrandRateSet { [brand: string]: { debit: number; credit1x: number; credit2to6: number; credit7to12: number } }
interface RateSnapshot {
    debit: number; credit1x: number; credit2to6: number; credit7to12: number; pix: number; rav: number;
    brandRates?: BrandRateSet; ravTipo?: string; ravRate?: number; ravPontual?: number;
}

function fmtPct(v: number): string {
    return v.toFixed(2).replace(".", ",") + "%";
}

function fmtDate(d: string): string {
    if (!d) return "—";
    try { return new Date(d + "T00:00:00").toLocaleDateString("pt-BR"); } catch { return d; }
}

export function generateProposalPDF(
    client: { name: string; stoneCode?: string; cnpj?: string; phone?: string; email?: string },
    negotiation: { dateNeg: string; rates: RateSnapshot; notes?: string; status: string },
    userName: string
) {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const green = [0, 168, 104] as const;
    const darkGray = [26, 26, 46] as const;
    const medGray = [107, 114, 128] as const;
    let y = 15;

    // ═══ HEADER BAND ═══
    doc.setFillColor(...green);
    doc.rect(0, 0, pageW, 40, "F");

    // Logo "BT"
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(15, 8, 24, 24, 4, 4, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(...green);
    doc.text("BT", 27, 24, { align: "center" });

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Proposta Comercial", 48, 18);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("BitTask — Gestão & Propostas", 48, 27);

    // Date
    doc.setFontSize(9);
    doc.text(`Emitido em ${new Date().toLocaleDateString("pt-BR")}`, pageW - 15, 18, { align: "right" });
    doc.text(`Agente: ${userName}`, pageW - 15, 25, { align: "right" });

    y = 50;

    // ═══ CLIENT DATA ═══
    doc.setFillColor(248, 250, 249);
    doc.roundedRect(15, y, pageW - 30, 40, 3, 3, "F");
    doc.setDrawColor(229, 231, 235);
    doc.roundedRect(15, y, pageW - 30, 40, 3, 3, "S");

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...darkGray);
    doc.text("DADOS DO CLIENTE", 22, y + 9);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...medGray);
    const clientLines = [
        `Nome: ${client.name}`,
        client.stoneCode ? `Stone Code: ${client.stoneCode}` : "",
        client.cnpj ? `CNPJ/CPF: ${client.cnpj}` : "",
        client.phone ? `Telefone: ${client.phone}` : "",
        client.email ? `Email: ${client.email}` : "",
        `Data da Nego.: ${fmtDate(negotiation.dateNeg)}`,
    ].filter(Boolean);

    let lineY = y + 16;
    const col1 = clientLines.slice(0, 3);
    const col2 = clientLines.slice(3);
    col1.forEach((l, i) => { doc.text(l, 22, lineY + i * 5.5); });
    col2.forEach((l, i) => { doc.text(l, pageW / 2 + 5, lineY + i * 5.5); });

    y += 50;

    // ═══ RATES TABLE ═══
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...darkGray);
    doc.text("TAXAS PROPOSTAS", 15, y);
    y += 7;

    const rates = negotiation.rates;
    const brandRates = rates.brandRates || {};
    const brands = Object.keys(brandRates);

    if (brands.length > 0) {
        // Per-brand table
        const headers = ["Bandeira", "Débito", "Crédito 1x", "2-6x", "7-12x"];
        const body = brands.map(b => {
            const r = brandRates[b];
            return [b, fmtPct(r.debit), fmtPct(r.credit1x), fmtPct(r.credit2to6), fmtPct(r.credit7to12)];
        });

        (doc as any).autoTable({
            startY: y,
            head: [headers],
            body: body,
            theme: "striped",
            headStyles: { fillColor: green, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9, halign: "center" },
            bodyStyles: { fontSize: 9, halign: "center", textColor: darkGray },
            alternateRowStyles: { fillColor: [248, 250, 249] },
            margin: { left: 15, right: 15 },
            columnStyles: { 0: { halign: "left", fontStyle: "bold" } },
        });
        y = (doc as any).lastAutoTable.finalY + 8;
    } else {
        // Simple rates
        const headers = ["Modalidade", "Taxa"];
        const body = [
            ["Débito", fmtPct(rates.debit)],
            ["Crédito 1x", fmtPct(rates.credit1x)],
            ["Crédito 2-6x", fmtPct(rates.credit2to6)],
            ["Crédito 7-12x", fmtPct(rates.credit7to12)],
        ];

        (doc as any).autoTable({
            startY: y,
            head: [headers],
            body: body,
            theme: "striped",
            headStyles: { fillColor: green, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 10, halign: "center" },
            bodyStyles: { fontSize: 10, halign: "center", textColor: darkGray },
            margin: { left: 15, right: 15 },
            columnStyles: { 0: { halign: "left", fontStyle: "bold" } },
        });
        y = (doc as any).lastAutoTable.finalY + 8;
    }

    // PIX + RAV row
    const extras = [
        ["PIX", fmtPct(rates.pix)],
        ["RAV", fmtPct(rates.ravRate ?? rates.rav)],
    ];

    (doc as any).autoTable({
        startY: y,
        head: [["Serviço", "Taxa"]],
        body: extras,
        theme: "striped",
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9, halign: "center" },
        bodyStyles: { fontSize: 9, halign: "center", textColor: darkGray },
        margin: { left: 15, right: 15 },
        columnStyles: { 0: { halign: "left", fontStyle: "bold" } },
    });
    y = (doc as any).lastAutoTable.finalY + 10;

    // ═══ NOTES ═══
    if (negotiation.notes) {
        doc.setFillColor(248, 250, 249);
        doc.roundedRect(15, y, pageW - 30, 25, 3, 3, "F");
        doc.setDrawColor(229, 231, 235);
        doc.roundedRect(15, y, pageW - 30, 25, 3, 3, "S");

        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...darkGray);
        doc.text("OBSERVAÇÕES", 22, y + 8);

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...medGray);
        const splitted = doc.splitTextToSize(negotiation.notes, pageW - 50);
        doc.text(splitted.slice(0, 3), 22, y + 15);
        y += 30;
    }

    // ═══ FOOTER ═══
    const footerY = doc.internal.pageSize.getHeight() - 15;
    doc.setDrawColor(...green);
    doc.setLineWidth(0.5);
    doc.line(15, footerY - 5, pageW - 15, footerY - 5);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...medGray);
    doc.text("Gerado por BitTask — Gestão Inteligente de Negociações & Propostas", pageW / 2, footerY, { align: "center" });
    doc.text(`Agente: ${userName} | ${new Date().toLocaleString("pt-BR")}`, pageW / 2, footerY + 4, { align: "center" });

    // Download
    const fileName = `Proposta_${client.name.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;
    doc.save(fileName);
}
