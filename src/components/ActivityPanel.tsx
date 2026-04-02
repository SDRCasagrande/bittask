"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    Activity, Calendar, UserPlus, FileCheck, CheckCircle2, XCircle,
    ChevronRight, Loader2, Filter, ListChecks, Zap, TrendingUp,
    CalendarPlus
} from "lucide-react";

interface ActivitySummary {
    newClients: number;
    newActives: number;
    newProposals: number;
    approved: number;
    rejected: number;
    totalNegotiations: number;
    tasksCreated: number;
    tasksCompleted: number;
}

interface ActivityClient {
    id: string; name: string; stoneCode: string; brand: string; safra: string;
    status: string; createdAt: string; cnpj: string;
}

interface ActivityNeg {
    id: string; status: string; dateNeg?: string; dateAccept?: string;
    clientName: string; clientStoneCode: string; brand: string; createdAt: string;
}

interface ActivityData {
    period: string; from: string; to: string;
    summary: ActivitySummary;
    newClients: ActivityClient[];
    newActives: (ActivityClient & { credentialDate: string })[];
    proposals: ActivityNeg[];
    approved: ActivityNeg[];
}

const PERIOD_OPTIONS = [
    { value: "today", label: "Hoje" },
    { value: "week", label: "7 dias" },
    { value: "month", label: "Mês" },
    { value: "custom", label: "Período" },
];

function fmtDate(d: string) { try { return new Date(d + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }); } catch { return d; } }

export default function ActivityPanel() {
    const [data, setData] = useState<ActivityData | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState("month");
    const [customFrom, setCustomFrom] = useState("");
    const [customTo, setCustomTo] = useState("");
    const [activeTab, setActiveTab] = useState<"overview" | "clients" | "proposals" | "actives">("overview");

    const loadData = async (p: string) => {
        setLoading(true);
        let url = `/api/metrics/activity?period=${p}`;
        if (p === "custom" && customFrom && customTo) {
            url += `&from=${customFrom}&to=${customTo}`;
        }
        try {
            const res = await fetch(url);
            const d = await res.json();
            if (!d.error) setData(d);
        } catch { /* */ }
        setLoading(false);
    };

    useEffect(() => { loadData(period); }, [period]);

    const handleCustomApply = () => {
        if (customFrom && customTo) loadData("custom");
    };

    const summary = data?.summary || { newClients: 0, newActives: 0, newProposals: 0, approved: 0, rejected: 0, totalNegotiations: 0, tasksCreated: 0, tasksCompleted: 0 };

    const COUNTER_CARDS = [
        { key: "clients", label: "Novos Cadastros", value: summary.newClients, icon: UserPlus, color: "text-[#00A868]", bg: "bg-[#00A868]/10", tab: "clients" as const },
        { key: "proposals", label: "Novas Propostas", value: summary.newProposals, icon: FileCheck, color: "text-amber-500", bg: "bg-amber-500/10", tab: "proposals" as const },
        { key: "approved", label: "Aprovados", value: summary.approved, icon: CheckCircle2, color: "text-[#00A868]", bg: "bg-[#00A868]/10", tab: "overview" as const },
        { key: "actives", label: "Novos Ativos", value: summary.newActives, icon: TrendingUp, color: "text-purple-500", bg: "bg-purple-500/10", tab: "actives" as const },
    ];

    return (
        <div className="card-elevated overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#00A868]/10 flex items-center justify-center">
                        <Activity className="w-3.5 h-3.5 text-[#00A868]" />
                    </div>
                    Painel de Controle
                </h3>
                <div className="flex items-center gap-1">
                    {PERIOD_OPTIONS.map(o => (
                        <button key={o.value} onClick={() => setPeriod(o.value)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${period === o.value
                                ? "bg-[#00A868] text-white"
                                : "text-muted-foreground hover:bg-muted"}`}>
                            {o.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Custom Date Range */}
            {period === "custom" && (
                <div className="flex items-center gap-2 px-5 py-2.5 bg-muted/30 border-b border-border">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                        className="px-2.5 py-1 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:border-[#00A868]/50" />
                    <span className="text-xs text-muted-foreground">até</span>
                    <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                        className="px-2.5 py-1 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:border-[#00A868]/50" />
                    <button onClick={handleCustomApply}
                        className="px-3 py-1 bg-[#00A868] text-white rounded-lg text-xs font-medium hover:bg-[#008f58] transition-colors">
                        <Filter className="w-3 h-3" />
                    </button>
                </div>
            )}

            {/* Loading Overlay for subsequent fetches */}
            {loading && data && (
                <div className="absolute inset-0 top-[60px] z-10 flex items-center justify-center bg-background/40 backdrop-blur-[1px]">
                    <Loader2 className="w-6 h-6 animate-spin text-[#00A868]" />
                </div>
            )}

            {!data && loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-[#00A868]" />
                </div>
            ) : (
                <div className={loading ? "opacity-60 pointer-events-none transition-opacity" : "transition-opacity"}>
                    {/* Counter Cards Row */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border">
                        {COUNTER_CARDS.map(card => (
                            <button key={card.key} onClick={() => setActiveTab(card.tab)}
                                className={`flex items-center gap-3 p-4 bg-background hover:bg-muted/30 transition-all text-left ${activeTab === card.tab ? "ring-inset ring-2 ring-[#00A868]/20" : ""}`}>
                                <div className={`w-9 h-9 rounded-xl ${card.bg} flex items-center justify-center shrink-0`}>
                                    <card.icon className={`w-4 h-4 ${card.color}`} />
                                </div>
                                <div>
                                    <p className="text-xl font-black text-foreground">{card.value}</p>
                                    <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">{card.label}</p>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Quick Stats Bar */}
                    <div className="flex items-center gap-4 px-5 py-2.5 bg-muted/20 border-t border-b border-border text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1"><XCircle className="w-3 h-3 text-red-400" /> {summary.rejected} recusados</span>
                        <span className="flex items-center gap-1"><ListChecks className="w-3 h-3 text-[#00A868]" /> {summary.tasksCreated} tarefas criadas</span>
                        <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-[#00A868]" /> {summary.tasksCompleted} concluídas</span>
                        <span className="ml-auto text-[10px] font-medium">{data?.from && `${fmtDate(data.from)} → ${fmtDate(data.to)}`}</span>
                    </div>

                    {/* Content based on active tab */}
                    <div className="max-h-[300px] overflow-y-auto divide-y divide-border">
                        {activeTab === "overview" && (
                            <>
                                {(data?.approved || []).length > 0 ? data?.approved.map(n => (
                                    <Link key={n.id} href="/dashboard/negociacoes"
                                        className="flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-8 h-8 rounded-lg bg-[#00A868]/10 flex items-center justify-center shrink-0">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-[#00A868]" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-foreground truncate">{n.clientName}</p>
                                                <p className="text-[10px] text-muted-foreground">{n.clientStoneCode && `SC: ${n.clientStoneCode} · `}{n.brand}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-[#00A868]/10 text-[#00A868]">Aprovado</span>
                                            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                                        </div>
                                    </Link>
                                )) : (
                                    <div className="text-center py-8 text-sm text-muted-foreground">
                                        <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                        <p>Nenhuma aprovação no período</p>
                                    </div>
                                )}
                            </>
                        )}

                        {activeTab === "clients" && (
                            <>
                                {(data?.newClients || []).length > 0 ? data?.newClients.map(c => (
                                    <Link key={c.id} href="/dashboard/clientes"
                                        className="flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-8 h-8 rounded-lg bg-[#00A868]/10 flex items-center justify-center shrink-0">
                                                <span className="text-xs font-bold text-[#00A868]">{c.name.charAt(0)}</span>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-foreground truncate">{c.name}</p>
                                                <p className="text-[10px] text-muted-foreground">
                                                    {c.stoneCode && `SC: ${c.stoneCode} · `}{c.brand} · {c.safra}
                                                    {c.cnpj && ` · ${c.cnpj}`}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${c.status === "ativo" ? "bg-[#00A868]/10 text-[#00A868]" : "bg-amber-500/10 text-amber-500"}`}>
                                                {c.status === "ativo" ? "Ativo" : "Novo"}
                                            </span>
                                            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                                        </div>
                                    </Link>
                                )) : (
                                    <div className="text-center py-8 text-sm text-muted-foreground">
                                        <UserPlus className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                        <p>Nenhum novo cadastro no período</p>
                                    </div>
                                )}
                            </>
                        )}

                        {activeTab === "proposals" && (
                            <>
                                {(data?.proposals || []).length > 0 ? data?.proposals.map(n => (
                                    <Link key={n.id} href="/dashboard/negociacoes"
                                        className="flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                                                <FileCheck className="w-3.5 h-3.5 text-amber-500" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-foreground truncate">{n.clientName}</p>
                                                <p className="text-[10px] text-muted-foreground">{n.clientStoneCode && `SC: ${n.clientStoneCode} · `}Criada {fmtDate(n.dateNeg || "")}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-500">Pendente</span>
                                            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                                        </div>
                                    </Link>
                                )) : (
                                    <div className="text-center py-8 text-sm text-muted-foreground">
                                        <FileCheck className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                        <p>Nenhuma proposta no período</p>
                                    </div>
                                )}
                            </>
                        )}

                        {activeTab === "actives" && (
                            <>
                                {(data?.newActives || []).length > 0 ? data?.newActives.map(c => (
                                    <Link key={c.id} href="/dashboard/clientes"
                                        className="flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                                                <TrendingUp className="w-3.5 h-3.5 text-purple-500" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-foreground truncate">{c.name}</p>
                                                <p className="text-[10px] text-muted-foreground">
                                                    {c.stoneCode && `SC: ${c.stoneCode} · `}Credenciado {fmtDate(c.credentialDate)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-[#00A868]/10 text-[#00A868]">Ativo</span>
                                            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                                        </div>
                                    </Link>
                                )) : (
                                    <div className="text-center py-8 text-sm text-muted-foreground">
                                        <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                        <p>Nenhum novo ativo no período</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Footer with action */}
                    <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/10">
                        <Link href="/dashboard/tarefas" className="text-xs text-[#00A868] hover:text-[#008f58] font-medium flex items-center gap-1 transition-colors">
                            <CalendarPlus className="w-3 h-3" /> Criar tarefa de follow-up
                        </Link>
                        <Link href="/dashboard/negociacoes" className="text-xs text-muted-foreground hover:text-foreground font-medium flex items-center gap-1 transition-colors">
                            Ver pipeline completo <ChevronRight className="w-3 h-3" />
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
