"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/calculator";

interface SavedProposal {
    id: string;
    clienteNome: string;
    clienteCNPJ: string;
    tpv: number;
    economy: number;
    savedAt: string;
}

const PROPOSALS_KEY = "bitkaiser_proposals_history";
const PROPOSTA_KEY = "bitkaiser_proposta";

export default function MinhasPropostasPage() {
    const [proposals, setProposals] = useState<SavedProposal[]>([]);

    useEffect(() => {
        try {
            const saved = localStorage.getItem(PROPOSALS_KEY);
            if (saved) {
                setProposals(JSON.parse(saved));
            }
        } catch { /* ignore */ }
    }, []);

    function saveCurrentProposal() {
        try {
            const current = localStorage.getItem(PROPOSTA_KEY);
            if (!current) return;
            const d = JSON.parse(current);
            const newProposal: SavedProposal = {
                id: Date.now().toString(),
                clienteNome: d.clienteNome || "Sem nome",
                clienteCNPJ: d.clienteCNPJ || "",
                tpv: d.tpv || 0,
                economy: 0,
                savedAt: new Date().toISOString(),
            };
            const updated = [newProposal, ...proposals];
            setProposals(updated);
            localStorage.setItem(PROPOSALS_KEY, JSON.stringify(updated));
        } catch { /* ignore */ }
    }

    function removeProposal(id: string) {
        const updated = proposals.filter((p) => p.id !== id);
        setProposals(updated);
        localStorage.setItem(PROPOSALS_KEY, JSON.stringify(updated));
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-foreground">Minhas Propostas</h1>
                    <p className="text-sm text-muted-foreground">
                        Histórico de propostas geradas
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={saveCurrentProposal}
                        className="px-4 py-2 text-sm rounded-xl bg-[#00A868]/10 text-[#00A868] hover:bg-[#00A868]/20 transition-colors"
                    >
                        💾 Salvar Proposta Atual
                    </button>
                    <Link
                        href="/dashboard/proposta"
                        className="px-4 py-2 text-sm rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:from-emerald-500 hover:to-emerald-400 transition-all shadow-sm"
                    >
                        ➕ Nova Proposta
                    </Link>
                </div>
            </div>

            {/* Proposals List */}
            {proposals.length === 0 ? (
                <div className="card-elevated p-12 text-center">
                    <p className="text-4xl mb-4">📁</p>
                    <p className="font-semibold text-foreground">Nenhuma proposta salva</p>
                    <p className="text-sm text-muted-foreground mt-2">
                        Crie uma proposta no workspace e salve aqui para consultar depois.
                    </p>
                    <Link
                        href="/dashboard/proposta"
                        className="inline-block mt-4 px-6 py-2.5 text-sm rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:from-emerald-500 hover:to-emerald-400 transition-all"
                    >
                        Criar Proposta
                    </Link>
                </div>
            ) : (
                <div className="space-y-3">
                    {proposals.map((proposal) => (
                        <div
                            key={proposal.id}
                            className="card-elevated p-5 flex items-center gap-4"
                        >
                            <div className="w-12 h-12 rounded-xl bg-[#00A868]/10 flex items-center justify-center">
                                <span className="text-xl">📋</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-foreground truncate">
                                    {proposal.clienteNome}
                                </p>
                                <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                                    {proposal.clienteCNPJ && <span>{proposal.clienteCNPJ}</span>}
                                    {proposal.tpv > 0 && (
                                        <span>TPV: {formatCurrency(proposal.tpv)}</span>
                                    )}
                                    <span>
                                        {new Date(proposal.savedAt).toLocaleDateString("pt-BR")}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => removeProposal(proposal.id)}
                                className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                                🗑️
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
