"use client";

import { useState, useEffect } from "react";
import { Target, Briefcase, DollarSign, Handshake, Loader2, Pencil, X, Save } from "lucide-react";

interface GoalsData {
    month: string;
    targets: { clients: number; tpv: number; deals: number };
    actual: { clients: number; tpv: number; deals: number };
}

function fmtMoney(v: number) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }); }
function fmtMonth(m: string) { if (!m) return "—"; const [y, mo] = m.split("-"); const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]; return `${months[parseInt(mo) - 1]}/${y}`; }

function CircularProgress({ pct, color, size = 56 }: { pct: number; color: string; size?: number }) {
    const r = (size - 6) / 2;
    const circ = 2 * Math.PI * r;
    const clampedPct = Math.min(pct, 100);

    return (
        <svg className="-rotate-90" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth="4" className="text-muted/30" />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="4"
                strokeDasharray={`${(clampedPct / 100) * circ} ${circ}`}
                strokeLinecap="round" className="transition-all duration-1000" />
        </svg>
    );
}

export default function GoalsWidget() {
    const [data, setData] = useState<GoalsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [targets, setTargets] = useState({ clients: 10, tpv: 100000, deals: 15 });
    const [saving, setSaving] = useState(false);

    const loadGoals = async () => {
        try {
            const res = await fetch("/api/goals");
            const d = await res.json();
            if (!d.error) {
                setData(d);
                setTargets(d.targets);
            }
        } catch { /* */ }
        setLoading(false);
    };

    useEffect(() => { loadGoals(); }, []);

    const saveGoals = async () => {
        setSaving(true);
        try {
            await fetch("/api/goals", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ targetClients: targets.clients, targetTPV: targets.tpv, targetDeals: targets.deals }),
            });
            loadGoals();
            setEditing(false);
        } catch { /* */ }
        setSaving(false);
    };

    if (loading) return null; // Don't show loading state, just wait
    if (!data) return null;

    const items = [
        {
            label: "Clientes",
            actual: data.actual.clients,
            target: data.targets.clients,
            icon: Briefcase,
            color: "#00A868",
            format: (v: number) => `${v}`,
        },
        {
            label: "TPV",
            actual: data.actual.tpv,
            target: data.targets.tpv,
            icon: DollarSign,
            color: "#6366f1",
            format: (v: number) => fmtMoney(v),
        },
        {
            label: "Deals",
            actual: data.actual.deals,
            target: data.targets.deals,
            icon: Handshake,
            color: "#f59e0b",
            format: (v: number) => `${v}`,
        },
    ];

    return (
        <div className="card-elevated p-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center">
                        <Target className="w-3.5 h-3.5 text-purple-500" />
                    </div>
                    Metas {fmtMonth(data.month)}
                </h3>
                <button onClick={() => setEditing(!editing)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                    {editing ? <X className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
                    {editing ? "Cancelar" : "Editar"}
                </button>
            </div>

            {editing ? (
                <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="text-[10px] text-muted-foreground font-bold uppercase block mb-1">Clientes</label>
                            <input type="number" value={targets.clients} onChange={e => setTargets(t => ({ ...t, clients: parseInt(e.target.value) || 0 }))}
                                className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none" />
                        </div>
                        <div>
                            <label className="text-[10px] text-muted-foreground font-bold uppercase block mb-1">TPV (R$)</label>
                            <input type="number" value={targets.tpv} onChange={e => setTargets(t => ({ ...t, tpv: parseFloat(e.target.value) || 0 }))}
                                className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none" />
                        </div>
                        <div>
                            <label className="text-[10px] text-muted-foreground font-bold uppercase block mb-1">Deals</label>
                            <input type="number" value={targets.deals} onChange={e => setTargets(t => ({ ...t, deals: parseInt(e.target.value) || 0 }))}
                                className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none" />
                        </div>
                    </div>
                    <button onClick={saveGoals} disabled={saving}
                        className="w-full py-2 rounded-xl bg-[#00A868] text-white text-sm font-bold hover:bg-[#008f58] disabled:opacity-50 flex items-center justify-center gap-2">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Salvar Metas
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-4">
                    {items.map(item => {
                        const pct = item.target > 0 ? (item.actual / item.target) * 100 : 0;
                        const statusColor = pct >= 80 ? "#00A868" : pct >= 50 ? "#f59e0b" : "#ef4444";

                        return (
                            <div key={item.label} className="flex flex-col items-center text-center">
                                <div className="relative mb-2">
                                    <CircularProgress pct={pct} color={statusColor} size={64} />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-xs font-black" style={{ color: statusColor }}>{Math.round(pct)}%</span>
                                    </div>
                                </div>
                                <p className="text-xs font-bold text-foreground">{item.format(item.actual)}</p>
                                <p className="text-[9px] text-muted-foreground">de {item.format(item.target)}</p>
                                <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider mt-0.5">{item.label}</p>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
