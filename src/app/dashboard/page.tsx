"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatPercent } from "@/lib/calculator";

interface Metrics {
    totalClients: number;
    totalNegotiations: number;
    pendingNeg: number;
    acceptedNeg: number;
    rejectedNeg: number;
    conversionRate: number;
    avgRates: { debit: number; credit1x: number; credit2to6: number; credit7to12: number; pix: number; rav: number };
    recentClients: { id: string; name: string; stoneCode: string; cnpj: string; negotiations: { status: string; dateNeg: string; rates: Record<string, number> }[] }[];
}

export default function DashboardPage() {
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState("");

    useEffect(() => {
        Promise.all([
            fetch("/api/metrics").then((r) => r.json()).catch(() => null),
            fetch("/api/auth/me").then((r) => r.json()).catch(() => ({})),
        ]).then(([m, u]) => {
            if (m && !m.error) setMetrics(m);
            if (u?.user?.name) setUserName(u.user.name);
            setLoading(false);
        });
    }, []);

    const fmtDate = (d: string) => { try { return new Date(d + "T00:00:00").toLocaleDateString("pt-BR"); } catch { return d; } };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-5">
            {/* Welcome */}
            <div className="glass-card rounded-2xl p-6 bg-gradient-to-r from-emerald-500/10 to-blue-500/5">
                <h1 className="text-xl font-bold text-foreground">
                    {userName ? `Olá, ${userName}! 👋` : "Bem-vindo! 👋"}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">Painel de controle BitKaiser Taxas</p>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                {[
                    { label: "Clientes", value: metrics?.totalClients ?? 0, icon: "👥", color: "emerald" },
                    { label: "Negociações", value: metrics?.totalNegotiations ?? 0, icon: "🤝", color: "blue" },
                    { label: "Pendentes", value: metrics?.pendingNeg ?? 0, icon: "⏳", color: "amber" },
                    { label: "Aceitas", value: metrics?.acceptedNeg ?? 0, icon: "✅", color: "emerald" },
                    { label: "Conversão", value: `${(metrics?.conversionRate ?? 0).toFixed(1)}%`, icon: "📈", color: "purple" },
                ].map((kpi) => (
                    <div key={kpi.label} className="glass-card rounded-xl p-4 text-center">
                        <p className="text-2xl mb-1">{kpi.icon}</p>
                        <p className={`text-2xl font-bold text-${kpi.color}-500`}>{kpi.value}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">{kpi.label}</p>
                    </div>
                ))}
            </div>

            {/* Row: Average Rates + Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Average Accepted Rates */}
                <div className="glass-card rounded-xl p-4">
                    <h3 className="text-sm font-bold text-foreground mb-3">📊 Taxas Médias Praticadas (Aceitas)</h3>
                    {metrics && metrics.acceptedNeg > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                            {[
                                { l: "Débito", v: metrics.avgRates.debit },
                                { l: "Créd 1x", v: metrics.avgRates.credit1x },
                                { l: "2-6x", v: metrics.avgRates.credit2to6 },
                                { l: "7-12x", v: metrics.avgRates.credit7to12 },
                                { l: "PIX", v: metrics.avgRates.pix },
                                { l: "RAV", v: metrics.avgRates.rav },
                            ].map((r) => (
                                <div key={r.l} className="bg-emerald-500/10 rounded-lg p-2 text-center">
                                    <p className="text-[9px] text-muted-foreground uppercase">{r.l}</p>
                                    <p className="text-sm font-bold text-emerald-500">{formatPercent(r.v)}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-muted-foreground text-center py-4">Nenhuma negociação aceita ainda</p>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="glass-card rounded-xl p-4">
                    <h3 className="text-sm font-bold text-foreground mb-3">⚡ Ações Rápidas</h3>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { href: "/dashboard/proposta", label: "Novo Simulação", icon: "📊", desc: "Comparar taxas e gerar proposta" },
                            { href: "/dashboard/negociacoes", label: "Novo Cliente", icon: "➕", desc: "Cadastrar cliente no CRM" },
                            { href: "/dashboard/cet", label: "Calcular CET", icon: "🧮", desc: "Custo efetivo por parcela" },
                            { href: "/dashboard/comparativo", label: "Comparação", icon: "📋", desc: "Stone vs concorrente" },
                        ].map((a) => (
                            <Link key={a.href} href={a.href}
                                className="flex items-start gap-2.5 p-3 rounded-xl bg-secondary hover:bg-muted hover:ring-1 hover:ring-emerald-500/30 transition-all">
                                <span className="text-xl">{a.icon}</span>
                                <div>
                                    <p className="text-xs font-semibold text-foreground">{a.label}</p>
                                    <p className="text-[10px] text-muted-foreground">{a.desc}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent Clients */}
            {metrics && metrics.recentClients.length > 0 && (
                <div className="glass-card rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-foreground">🕐 Clientes Recentes</h3>
                        <Link href="/dashboard/negociacoes" className="text-xs text-emerald-500 hover:underline">Ver todos →</Link>
                    </div>
                    <div className="space-y-2">
                        {metrics.recentClients.map((c) => {
                            const last = c.negotiations[0];
                            const stColor = { pendente: "text-amber-500", aceita: "text-emerald-500", recusada: "text-red-500" };
                            const stLabel = { pendente: "⏳ Pendente", aceita: "✅ Aceita", recusada: "❌ Recusada" };
                            return (
                                <Link key={c.id} href="/dashboard/negociacoes"
                                    className="flex items-center justify-between p-2.5 rounded-lg bg-secondary hover:bg-muted transition-colors">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                                            <span className="text-xs font-bold text-emerald-500">{c.name.charAt(0).toUpperCase()}</span>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-foreground truncate">{c.name}</p>
                                            <div className="flex gap-2 text-[10px] text-muted-foreground">
                                                {c.stoneCode && <span>SC: {c.stoneCode}</span>}
                                                {c.cnpj && <span>{c.cnpj}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    {last && (
                                        <div className="flex items-center gap-3 flex-shrink-0">
                                            <span className="text-[10px] text-muted-foreground">{fmtDate(last.dateNeg)}</span>
                                            <span className={`text-[10px] font-semibold ${stColor[last.status as keyof typeof stColor] || "text-foreground"}`}>
                                                {stLabel[last.status as keyof typeof stLabel] || last.status}
                                            </span>
                                        </div>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Negotiation Funnel */}
            {metrics && metrics.totalNegotiations > 0 && (
                <div className="glass-card rounded-xl p-4">
                    <h3 className="text-sm font-bold text-foreground mb-3">📊 Funil de Negociações</h3>
                    <div className="flex items-center gap-2 h-6 rounded-full overflow-hidden bg-secondary">
                        {metrics.acceptedNeg > 0 && (
                            <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 flex items-center justify-center text-[10px] font-bold text-white px-2"
                                style={{ width: `${(metrics.acceptedNeg / metrics.totalNegotiations) * 100}%`, minWidth: 40 }}>
                                {metrics.acceptedNeg} ✅
                            </div>
                        )}
                        {metrics.pendingNeg > 0 && (
                            <div className="h-full bg-gradient-to-r from-amber-500 to-amber-400 flex items-center justify-center text-[10px] font-bold text-white px-2"
                                style={{ width: `${(metrics.pendingNeg / metrics.totalNegotiations) * 100}%`, minWidth: 40 }}>
                                {metrics.pendingNeg} ⏳
                            </div>
                        )}
                        {metrics.rejectedNeg > 0 && (
                            <div className="h-full bg-gradient-to-r from-red-500 to-red-400 flex items-center justify-center text-[10px] font-bold text-white px-2"
                                style={{ width: `${(metrics.rejectedNeg / metrics.totalNegotiations) * 100}%`, minWidth: 40 }}>
                                {metrics.rejectedNeg} ❌
                            </div>
                        )}
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5 px-1">
                        <span>Aceitas: {(metrics.conversionRate).toFixed(1)}%</span>
                        <span>Total: {metrics.totalNegotiations}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
