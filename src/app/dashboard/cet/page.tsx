"use client";

import { useState, useEffect, useCallback } from "react";
import {
    calculateCET,
    formatPercent,
    BRAND_PRESETS,
    type BrandRates,
    type BrandContainer,
} from "@/lib/calculator";

const STORAGE_KEY = "bitkaiser_stone_rates";

function getDefaultContainers(): BrandContainer[] {
    return Object.entries(BRAND_PRESETS).map(([name, rates]) => ({
        name,
        rates: { ...rates },
        enabled: name === "VISA/MASTER",
    }));
}

function getMDR(rates: BrandRates, inst: number) {
    if (inst <= 1) return rates.credit1x;
    if (inst <= 6) return rates.credit2to6;
    if (inst <= 12) return rates.credit7to12;
    return rates.credit13to18;
}

export default function CETCalculatorPage() {
    const [ravRate, setRavRate] = useState(1.3);
    const [containers, setContainers] = useState<BrandContainer[]>(getDefaultContainers);

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const data = JSON.parse(saved);
                if (data.ravRate) setRavRate(data.ravRate);
                if (data.containers) setContainers(data.containers);
            }
        } catch { /* ignore */ }
    }, []);

    // Auto-save to localStorage
    const saveToStorage = useCallback(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ ravRate, containers }));
        } catch { /* ignore */ }
    }, [ravRate, containers]);

    useEffect(() => {
        saveToStorage();
    }, [saveToStorage]);

    function handleReset() {
        setRavRate(1.3);
        setContainers(getDefaultContainers());
        localStorage.removeItem(STORAGE_KEY);
    }

    function toggleBrand(index: number) {
        setContainers((prev) =>
            prev.map((c, i) => (i === index ? { ...c, enabled: !c.enabled } : c))
        );
    }

    function updateRate(index: number, field: keyof BrandRates, value: number) {
        setContainers((prev) =>
            prev.map((c, i) =>
                i === index ? { ...c, rates: { ...c.rates, [field]: value } } : c
            )
        );
    }

    function getCETColor(cet: number): string {
        if (cet < 5) return "text-emerald-500";
        if (cet < 10) return "text-amber-500";
        return "text-red-500";
    }

    function getCETBg(cet: number): string {
        if (cet < 5) return "bg-emerald-500/10";
        if (cet < 10) return "bg-amber-500/10";
        return "bg-red-500/10";
    }

    const enabledCount = containers.filter((c) => c.enabled).length;
    const enabled = containers.filter((c) => c.enabled);

    const [newBrandInput, setNewBrandInput] = useState("");
    const [showNewBrand, setShowNewBrand] = useState(false);

    function addCustomBrand(name: string) {
        if (name && !containers.find(c => c.name === name)) {
            setContainers([...containers, { name, rates: { debit: 0, credit1x: 0, credit2to6: 0, credit7to12: 0, credit13to18: 0 }, enabled: true }]);
        }
    }

    function removeCustomBrand(name: string) {
        setContainers(containers.filter(c => c.name !== name));
    }

    function exportPDF() {
        const w = window.open("", "_blank");
        if (!w) return;
        let html = `<html><head><title>CET Stone</title><style>body{font-family:Arial;font-size:11px;padding:20px}table{width:100%;border-collapse:collapse;margin-bottom:20px}th,td{border:1px solid #ccc;padding:4px 8px;text-align:center}th{background:#f0f0f0}.brand{font-size:14px;font-weight:bold;margin:10px 0 5px}.header{font-size:16px;font-weight:bold;margin-bottom:10px}</style></head><body>`;
        html += `<div class="header">Tabela CET Stone - RAV: ${formatPercent(ravRate)}</div>`;
        enabled.forEach(c => {
            html += `<div class="brand">${c.name} (Debito: ${formatPercent(c.rates.debit)})</div>`;
            html += `<table><tr><th>Parcela</th>`;
            for (let i = 1; i <= 18; i++) html += `<th>${i}x</th>`;
            html += `</tr><tr><td>MDR</td>`;
            for (let i = 1; i <= 18; i++) html += `<td>${formatPercent(getMDR(c.rates, i))}</td>`;
            html += `</tr><tr><td>CET</td>`;
            for (let i = 1; i <= 18; i++) html += `<td>${formatPercent(calculateCET(getMDR(c.rates, i), ravRate, i))}</td>`;
            html += `</tr></table>`;
        });
        html += `<p style="font-size:9px;color:#888">Gerado em ${new Date().toLocaleDateString("pt-BR")}</p></body></html>`;
        w.document.write(html); w.document.close(); w.print();
    }

    function exportExcel() {
        let csv = "Bandeira;Parcela;MDR;CET\n";
        enabled.forEach(c => {
            for (let i = 1; i <= 18; i++) {
                const mdr = getMDR(c.rates, i);
                csv += `${c.name};${i}x;${mdr.toFixed(2).replace(".", ",")};${calculateCET(mdr, ravRate, i).toFixed(2).replace(".", ",")}\n`;
            }
        });
        const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url;
        a.download = `CET_Stone_${new Date().toISOString().split("T")[0]}.csv`;
        a.click(); URL.revokeObjectURL(url);
    }

    function shareWhatsApp() {
        let txt = `TABELA CET STONE\nRAV: ${formatPercent(ravRate)}\n`;
        enabled.forEach(c => {
            txt += `\n${c.name} (Deb: ${formatPercent(c.rates.debit)}):\n`;
            for (let i = 1; i <= 12; i++) {
                const mdr = getMDR(c.rates, i);
                txt += `${i}x: MDR ${formatPercent(mdr)} | CET ${formatPercent(calculateCET(mdr, ravRate, i))}\n`;
            }
        });
        window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`, "_blank");
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header Controls */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-foreground">Calculador CET</h1>
                    <p className="text-sm text-muted-foreground">
                        Análise de Custo Efetivo Total por parcela e bandeira
                    </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <button onClick={handleReset}
                        className="px-4 py-2 text-sm rounded-xl bg-secondary text-secondary-foreground hover:bg-muted transition-colors">Resetar</button>
                    <button onClick={exportPDF}
                        className="px-4 py-2 text-sm rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">PDF</button>
                    <button onClick={exportExcel}
                        className="px-4 py-2 text-sm rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors">Excel</button>
                    <button onClick={shareWhatsApp}
                        className="px-4 py-2 text-sm rounded-xl bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors">WhatsApp</button>
                </div>
            </div>

            {/* RAV Control */}
            <div className="glass-card rounded-2xl p-5">
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-foreground">
                            Taxa de Antecipação (RAV):
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                inputMode="decimal"
                                value={ravRate}
                                onChange={(e) => { const n = parseFloat(e.target.value.replace(",", ".")); if (!isNaN(n)) setRavRate(n); }}
                                className="w-24 px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm text-center focus:ring-2 focus:ring-emerald-500"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                %
                            </span>
                        </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                        {enabledCount} bandeira{enabledCount !== 1 ? "s" : ""} ativa{enabledCount !== 1 ? "s" : ""}
                    </span>
                </div>
            </div>

            {/* Brand Toggle Chips */}
            <div className="flex flex-wrap gap-2">
                {containers.map((container, idx) => (
                    <div key={container.name} className="relative group">
                        <button
                            onClick={() => toggleBrand(idx)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border
              ${container.enabled
                                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                                    : "bg-secondary border-border text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            {container.enabled ? "✓" : "○"} {container.name}
                        </button>
                        {!BRAND_PRESETS[container.name] && (
                            <button onClick={() => removeCustomBrand(container.name)}
                                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[8px] leading-none hidden group-hover:flex items-center justify-center">x</button>
                        )}
                    </div>
                ))}
                {showNewBrand ? (
                    <div className="flex items-center gap-1">
                        <input type="text" value={newBrandInput} autoFocus
                            onChange={(e) => setNewBrandInput(e.target.value.toUpperCase())}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && newBrandInput.trim()) { addCustomBrand(newBrandInput.trim()); setNewBrandInput(""); setShowNewBrand(false); }
                                if (e.key === "Escape") { setNewBrandInput(""); setShowNewBrand(false); }
                            }}
                            placeholder="NOME DA BANDEIRA"
                            className="w-32 px-2 py-1.5 text-sm rounded-lg bg-secondary border border-emerald-500/40 text-foreground focus:ring-1 focus:ring-emerald-500" />
                        <button onClick={() => { addCustomBrand(newBrandInput.trim()); setNewBrandInput(""); setShowNewBrand(false); }}
                            className="px-2 py-1.5 text-sm text-emerald-400 hover:text-emerald-300">OK</button>
                        <button onClick={() => { setNewBrandInput(""); setShowNewBrand(false); }}
                            className="px-2 py-1.5 text-sm text-red-400 hover:text-red-300">X</button>
                    </div>
                ) : (
                    <button onClick={() => setShowNewBrand(true)}
                        className="px-4 py-2 rounded-xl text-sm font-medium bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-all">+ Bandeira</button>
                )}
            </div>

            {/* Brand Containers */}
            <div className={`grid gap-4 ${enabledCount > 2 ? "lg:grid-cols-2" : enabledCount === 2 ? "lg:grid-cols-2" : ""}`}>
                {containers
                    .filter((c) => c.enabled)
                    .map((container) => {
                        const containerIdx = containers.findIndex((c) => c.name === container.name);
                        return (
                            <div
                                key={container.name}
                                className="glass-card rounded-2xl overflow-hidden"
                            >
                                {/* Container Header */}
                                <div className="px-5 py-4 bg-gradient-to-r from-emerald-500/10 to-transparent border-b border-border">
                                    <h3 className="font-bold text-foreground flex items-center gap-2">
                                        💳 {container.name}
                                    </h3>
                                </div>

                                {/* MDR Inputs */}
                                <div className="p-5 space-y-4">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {[
                                            { key: "debit" as const, label: "Débito" },
                                            { key: "credit1x" as const, label: "Crédito 1x" },
                                            { key: "credit2to6" as const, label: "2-6x" },
                                            { key: "credit7to12" as const, label: "7-12x" },
                                            { key: "credit13to18" as const, label: "13-18x" },
                                        ].map((field) => (
                                            <div key={field.key}>
                                                <label className="text-[10px] text-muted-foreground uppercase tracking-wide">
                                                    {field.label}
                                                </label>
                                                <div className="relative mt-1">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={container.rates[field.key]}
                                                        onChange={(e) =>
                                                            updateRate(containerIdx, field.key, parseFloat(e.target.value) || 0)
                                                        }
                                                        className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:ring-2 focus:ring-emerald-500"
                                                    />
                                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                                                        %
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* CET Results Grid */}
                                    <div>
                                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                                            Tabela CET (1x a 18x)
                                        </h4>
                                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                                            {Array.from({ length: 18 }, (_, i) => i + 1).map((installment) => {
                                                const mdr =
                                                    installment <= 1
                                                        ? container.rates.credit1x
                                                        : installment <= 6
                                                            ? container.rates.credit2to6
                                                            : installment <= 12
                                                                ? container.rates.credit7to12
                                                                : container.rates.credit13to18;
                                                const cet = calculateCET(mdr, ravRate, installment);
                                                return (
                                                    <div
                                                        key={installment}
                                                        className={`p-2 rounded-lg text-center ${getCETBg(cet)} transition-colors duration-200`}
                                                    >
                                                        <p className="text-[10px] text-muted-foreground">
                                                            {installment}x
                                                        </p>
                                                        <p className={`text-sm font-bold ${getCETColor(cet)}`}>
                                                            {formatPercent(cet)}
                                                        </p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Debit Indicator */}
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="text-muted-foreground">Débito MDR:</span>
                                        <span className="font-semibold text-foreground">
                                            {formatPercent(container.rates.debit)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-emerald-500/20" /> CET &lt; 5% (Seguro)
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-amber-500/20" /> 5-10% (Atenção)
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-red-500/20" /> &gt; 10% (Alto)
                </span>
            </div>
        </div>
    );
}
