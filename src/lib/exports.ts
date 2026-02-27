import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { formatCurrency, formatPercent, calculateCET, getMDRForInstallment, type BrandRates } from "./calculator";

function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
}

export interface ProposalData {
    cliente: { nome: string; cnpj: string; telefone: string; email: string };
    tpv: number;
    volDebit: number;
    volCredit: number;
    volPix: number;
    shareDebit: number;
    shareCredit: number;
    sharePix: number;
    stoneRates: BrandRates;
    rav: number;
    pixRate: number;
    competitorName: string;
    compRates: { debit: number; credit1x: number; credit2to6: number; credit7to12: number; pix: number; rav: number };
    stoneFee: number;
    compFee: number;
    stoneRental: number;
    compRental: number;
    stoneTotal: number;
    compTotal: number;
    economy: number;
    agreementType: string;
    machines: number;
    isExempt: boolean;
}

// ─── PDF — TUDO EM 1 PÁGINA A4 PAISAGEM ───
export function exportPDF(data: ProposalData) {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const w = doc.internal.pageSize.getWidth(); // 297
    const h = doc.internal.pageSize.getHeight(); // 210
    const m = 8; // margin
    let y = m;
    const colW = (w - m * 3) / 2; // two-column layout

    // Colors
    const emerald: [number, number, number] = [0, 168, 104];
    const dark: [number, number, number] = [15, 23, 42];
    const darkCard: [number, number, number] = [30, 41, 59];
    const gray: [number, number, number] = [100, 116, 139];

    // Dark background
    doc.setFillColor(...dark);
    doc.rect(0, 0, w, h, "F");

    // Header bar
    doc.setFillColor(...emerald);
    doc.rect(0, 0, w, 14, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text(`PROPOSTA COMERCIAL STONE — ${data.cliente.nome || "Cliente"}`, m, 9);
    doc.setFontSize(7);
    doc.text(new Date().toLocaleDateString("pt-BR") + " " + new Date().toLocaleTimeString("pt-BR"), w - m, 9, { align: "right" });
    y = 18;

    // === LEFT COLUMN ===
    const lx = m;

    // Client info (compact)
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...emerald);
    doc.text("CLIENTE", lx, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(220, 220, 220);
    doc.text(`${data.cliente.nome || "—"}  |  ${data.cliente.cnpj || "—"}  |  ${data.cliente.telefone || "—"}`, lx, y + 4);
    y += 10;

    // Volume
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...emerald);
    doc.text("VOLUME (TPV)", lx, y);
    doc.setTextColor(255, 255, 255);
    doc.text(formatCurrency(data.tpv) + "/mês", lx + 40, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(200, 200, 200);
    doc.text(`Déb: ${formatCurrency(data.volDebit)} (${data.shareDebit.toFixed(0)}%) | Créd: ${formatCurrency(data.volCredit)} (${data.shareCredit.toFixed(0)}%) | PIX: ${formatCurrency(data.volPix)} (${data.sharePix.toFixed(0)}%)`, lx, y);
    y += 6;

    // Rates comparison table
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...emerald);
    doc.text("COMPARATIVO DE TAXAS", lx, y);
    y += 1;

    autoTable(doc, {
        startY: y,
        margin: { left: lx, right: w - lx - colW },
        head: [["", "Déb", "1x", "2-6x", "7-12x", "PIX", "RAV"]],
        body: [
            ["Stone", formatPercent(data.stoneRates.debit), formatPercent(data.stoneRates.credit1x), formatPercent(data.stoneRates.credit2to6), formatPercent(data.stoneRates.credit7to12), formatPercent(data.pixRate), formatPercent(data.rav)],
            [data.competitorName, formatPercent(data.compRates.debit), formatPercent(data.compRates.credit1x), formatPercent(data.compRates.credit2to6), formatPercent(data.compRates.credit7to12), formatPercent(data.compRates.pix), formatPercent(data.compRates.rav)],
        ],
        theme: "grid",
        styles: { fontSize: 6, halign: "center", cellPadding: 1.5, textColor: [255, 255, 255], fillColor: darkCard },
        headStyles: { fillColor: emerald as [number, number, number], textColor: [255, 255, 255], fontSize: 6 },
        columnStyles: { 0: { halign: "left", fontStyle: "bold" } },
        tableWidth: colW,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 4;

    // Costs summary
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...emerald);
    doc.text("CUSTOS MENSAIS", lx, y);
    y += 1;

    autoTable(doc, {
        startY: y,
        margin: { left: lx, right: w - lx - colW },
        head: [["", "Taxas", "Aluguel", "TOTAL"]],
        body: [
            ["Stone", formatCurrency(data.stoneFee), data.isExempt ? "ISENTO" : formatCurrency(data.stoneRental), formatCurrency(data.stoneTotal)],
            [data.competitorName, formatCurrency(data.compFee), formatCurrency(data.compRental), formatCurrency(data.compTotal)],
        ],
        theme: "grid",
        styles: { fontSize: 6, halign: "center", cellPadding: 1.5, textColor: [255, 255, 255], fillColor: darkCard },
        headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontSize: 6 },
        columnStyles: { 0: { halign: "left", fontStyle: "bold" } },
        tableWidth: colW,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 4;

    // Agreement
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...emerald);
    doc.text("ACORDO", lx, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(200, 200, 200);
    doc.text(`${data.agreementType === "fidelidade" ? "Fidelidade" : "Adesão"} | ${data.machines} máquina(s) ${data.isExempt ? "(ISENTO)" : ""}`, lx + 18, y);
    y += 6;

    // Economy block
    doc.setFillColor(...emerald);
    doc.roundedRect(lx, y, colW, 18, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(data.economy > 0 ? ">> ECONOMIA COM STONE" : ">> CUSTO ADICIONAL", lx + 3, y + 6);
    doc.setFontSize(14);
    doc.text(`${formatCurrency(Math.abs(data.economy))}/mês`, lx + 3, y + 14);
    doc.setFontSize(9);
    doc.text(`${formatCurrency(Math.abs(data.economy) * 12)}/ano`, lx + 60, y + 14);

    // === RIGHT COLUMN ===
    const rx = m * 2 + colW;
    let ry = 18;

    // CET table
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...emerald);
    doc.text("TABELA CET STONE (1x-12x)", rx, ry);
    ry += 1;

    const cetH = Array.from({ length: 12 }, (_, i) => `${i + 1}x`);
    const cetV = Array.from({ length: 12 }, (_, i) => {
        const mdr = getMDRForInstallment(data.stoneRates, i + 1);
        return formatPercent(calculateCET(mdr, data.rav, i + 1));
    });

    // 2 rows of 6 for compactness
    autoTable(doc, {
        startY: ry,
        margin: { left: rx, right: m },
        head: [cetH.slice(0, 6)],
        body: [cetV.slice(0, 6)],
        theme: "grid",
        styles: { fontSize: 6, halign: "center", cellPadding: 1.5, textColor: [255, 255, 255], fillColor: darkCard },
        headStyles: { fillColor: emerald as [number, number, number], textColor: [255, 255, 255], fontSize: 6 },
        tableWidth: colW,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ry = (doc as any).lastAutoTable.finalY + 1;

    autoTable(doc, {
        startY: ry,
        margin: { left: rx, right: m },
        head: [cetH.slice(6)],
        body: [cetV.slice(6)],
        theme: "grid",
        styles: { fontSize: 6, halign: "center", cellPadding: 1.5, textColor: [255, 255, 255], fillColor: darkCard },
        headStyles: { fillColor: emerald as [number, number, number], textColor: [255, 255, 255], fontSize: 6 },
        tableWidth: colW,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ry = (doc as any).lastAutoTable.finalY + 6;

    // Savings visual (big text on right column)
    doc.setFillColor(30, 41, 59);
    doc.roundedRect(rx, ry, colW, 30, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...gray);
    doc.text("RESUMO FINANCEIRO", rx + 3, ry + 5);

    doc.setFontSize(6);
    doc.setTextColor(200, 200, 200);
    const items = [
        { l: "Custo Stone (taxas + aluguel):", v: formatCurrency(data.stoneTotal) },
        { l: `Custo ${data.competitorName}:`, v: formatCurrency(data.compTotal) },
        { l: "Diferença mensal:", v: (data.economy > 0 ? "+" : "") + formatCurrency(data.economy) },
        { l: "Diferença anual:", v: (data.economy > 0 ? "+" : "") + formatCurrency(data.economy * 12) },
    ];
    items.forEach((item, i) => {
        doc.setTextColor(...gray);
        doc.text(item.l, rx + 3, ry + 10 + i * 5);
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.text(item.v, rx + colW - 3, ry + 10 + i * 5, { align: "right" });
        doc.setFont("helvetica", "normal");
    });

    // Footer
    doc.setFontSize(5);
    doc.setTextColor(80, 80, 80);
    doc.text(`Proposta gerada em ${new Date().toLocaleDateString("pt-BR")}`, w / 2, h - 4, { align: "center" });

    const filename = `Proposta_${(data.cliente.nome || "Stone").replace(/[^a-zA-Z0-9]/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;
    const blob = doc.output("blob");
    downloadBlob(blob, filename);
}

// ─── EXCEL EXPORT ───
export function exportExcel(data: ProposalData) {
    const wb = XLSX.utils.book_new();

    const resumoData = [
        [`PROPOSTA COMERCIAL — ${data.cliente.nome || "Cliente"}`],
        [""], ["DADOS DO CLIENTE"],
        ["Razão Social", data.cliente.nome], ["CNPJ/CPF", data.cliente.cnpj],
        ["Telefone", data.cliente.telefone], ["E-mail", data.cliente.email],
        [""], ["VOLUME (TPV)"],
        ["TPV Total", formatCurrency(data.tpv)],
        ["Débito", formatCurrency(data.volDebit), `${data.shareDebit.toFixed(1)}%`],
        ["Crédito", formatCurrency(data.volCredit), `${data.shareCredit.toFixed(1)}%`],
        ["PIX", formatCurrency(data.volPix), `${data.sharePix.toFixed(1)}%`],
        [""], ["ACORDO COMERCIAL"],
        ["Tipo", data.agreementType === "fidelidade" ? "Fidelidade" : "Adesão"],
        ["Máquinas", data.machines],
        ["Aluguel", data.isExempt ? "ISENTO" : formatCurrency(data.stoneRental)],
        [""], ["ECONOMIA"],
        ["Mensal", formatCurrency(data.economy)],
        ["Anual", formatCurrency(data.economy * 12)],
    ];
    const wsResumo = XLSX.utils.aoa_to_sheet(resumoData);
    wsResumo["!cols"] = [{ wch: 20 }, { wch: 18 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, wsResumo, "Resumo");

    const taxasData = [
        ["COMPARATIVO DE TAXAS"], [""],
        ["", "Débito", "Créd. 1x", "2-6x", "7-12x", "PIX", "RAV", "Custo Taxas", "Aluguel", "TOTAL"],
        ["Stone", formatPercent(data.stoneRates.debit), formatPercent(data.stoneRates.credit1x), formatPercent(data.stoneRates.credit2to6), formatPercent(data.stoneRates.credit7to12), formatPercent(data.pixRate), formatPercent(data.rav), formatCurrency(data.stoneFee), data.isExempt ? "ISENTO" : formatCurrency(data.stoneRental), formatCurrency(data.stoneTotal)],
        [data.competitorName, formatPercent(data.compRates.debit), formatPercent(data.compRates.credit1x), formatPercent(data.compRates.credit2to6), formatPercent(data.compRates.credit7to12), formatPercent(data.compRates.pix), formatPercent(data.compRates.rav), formatCurrency(data.compFee), formatCurrency(data.compRental), formatCurrency(data.compTotal)],
    ];
    const wsTaxas = XLSX.utils.aoa_to_sheet(taxasData);
    wsTaxas["!cols"] = Array(10).fill({ wch: 14 });
    XLSX.utils.book_append_sheet(wb, wsTaxas, "Taxas");

    const cetHeaderRow = ["Parcela", ...Array.from({ length: 12 }, (_, i) => `${i + 1}x`)];
    const cetValueRow = ["CET", ...Array.from({ length: 12 }, (_, i) => {
        const mdr = getMDRForInstallment(data.stoneRates, i + 1);
        return formatPercent(calculateCET(mdr, data.rav, i + 1));
    })];
    const wsCET = XLSX.utils.aoa_to_sheet([["TABELA CET STONE"], [""], cetHeaderRow, cetValueRow]);
    wsCET["!cols"] = Array(13).fill({ wch: 10 });
    XLSX.utils.book_append_sheet(wb, wsCET, "CET");

    const filename = `Proposta_${(data.cliente.nome || "Stone").replace(/[^a-zA-Z0-9]/g, "_")}_${new Date().toISOString().split("T")[0]}.xlsx`;
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    downloadBlob(blob, filename);
}
