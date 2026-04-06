"use client";

import { useState } from "react";
import { MessageSquare, Smartphone, QrCode, Search, Menu, Users, X, CheckCircle2, ChevronRight, RefreshCcw } from "lucide-react";

export default function WhatsAppHubPage() {
    const [view, setView] = useState<"connections" | "chat">("chat");

    return (
        <div className="flex h-[calc(100vh-6rem)] bg-card border border-border rounded-2xl overflow-hidden shadow-lg mt-2">
            
            {/* Sidebar (WhatsApp Style) */}
            <div className="w-80 flex flex-col border-r border-border shrink-0 bg-secondary/20">
                {/* Hub Header */}
                <div className="h-16 border-b border-border flex items-center justify-between px-4 bg-secondary/50">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-[#00A868] text-white flex items-center justify-center">
                            <MessageSquare className="w-4 h-4" />
                        </div>
                        <h2 className="font-bold text-sm">BitCRM Inbox</h2>
                    </div>
                    <div className="flex gap-1">
                        <button 
                            onClick={() => setView("chat")}
                            className={`p-1.5 rounded-lg transition-colors ${view === "chat" ? "bg-[#00A868]/20 text-[#00A868]" : "text-muted-foreground hover:bg-muted"}`}
                            title="Conversas"
                        >
                            <MessageSquare className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => setView("connections")}
                            className={`p-1.5 rounded-lg transition-colors ${view === "connections" ? "bg-[#00A868]/20 text-[#00A868]" : "text-muted-foreground hover:bg-muted"}`}
                            title="Gerenciar Conexões"
                        >
                            <Smartphone className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Sub-Header / Search */}
                <div className="p-3 border-b border-border">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input 
                            placeholder="Buscar contatos ou clientes..." 
                            className="w-full bg-secondary border border-border text-xs rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-[#00A868]/50 transition-colors"
                        />
                    </div>
                </div>

                {/* List Body */}
                <div className="flex-1 overflow-y-auto">
                    {view === "chat" ? (
                        <div className="flex flex-col">
                            {/* Dummy chat list */}
                            {[
                                { name: "Farmácia Boa Saúde", user: "João (Agente)", time: "10:45", msg: "Sim, e a taxa no PIX ficaria quanto?", unread: 2 },
                                { name: "Supermercados Alfa", user: "Maria (Gestora)", time: "09:30", msg: "A máquina foi instalada ontem! Tudo ok.", unread: 0 },
                                { name: "João Pedro Pereira (Stone)", user: "Sistema", time: "Ontem", msg: "Seu boleto da franquia", unread: 0 }
                            ].map((c, i) => (
                                <button key={i} className="flex items-center gap-3 p-3 border-b border-border/50 hover:bg-secondary/50 text-left transition-colors relative">
                                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0 border border-border">
                                        <span className="text-sm font-bold text-muted-foreground">{c.name.charAt(0)}</span>
                                    </div>
                                    <div className="flex-1 min-w-0 pr-6">
                                        <div className="flex justify-between items-center mb-0.5">
                                            <h4 className="text-sm font-semibold truncate text-foreground">{c.name}</h4>
                                            <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">{c.time}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate">{c.user}: {c.msg}</p>
                                    </div>
                                    {c.unread > 0 && (
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-[#00A868] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                            {c.unread}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col p-4 space-y-4">
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Aparelhos Conectados</h3>
                            <div className="p-3 bg-[#00A868]/10 border border-[#00A868]/20 rounded-xl relative overflow-hidden group hover:border-[#00A868]/40 transition-colors">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="px-2 py-0.5 bg-[#00A868]/20 text-[#00A868] text-[10px] font-bold rounded-md flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" /> Conectado
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">João (Agente Principal)</span>
                                </div>
                                <h4 className="text-sm font-semibold">Instância +55 (11) 98888-7777</h4>
                                <div className="mt-3 flex items-center gap-2">
                                    <button className="flex-1 bg-secondary text-xs py-1.5 rounded text-foreground font-medium border border-border hover:bg-muted transition-colors">
                                        Sincronizar Mensagens
                                    </button>
                                </div>
                            </div>

                            <button className="flex flex-col items-center justify-center w-full p-6 bg-secondary/50 border border-dashed border-border hover:border-[#00A868]/50 hover:bg-[#00A868]/5 rounded-xl transition-all group">
                                <QrCode className="w-8 h-8 text-muted-foreground group-hover:text-[#00A868] mb-2 transition-colors" />
                                <span className="text-sm font-semibold group-hover:text-[#00A868] transition-colors">Conectar Novo Aparelho</span>
                                <span className="text-[10px] text-muted-foreground mt-1 text-center">Via API BitCRM</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-muted/10 relative overflow-hidden">
                {view === "chat" ? (
                    <>
                        <div className="h-16 border-b border-border bg-secondary/50 flex items-center justify-between px-5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center border border-border">
                                    <span className="text-sm font-bold">F</span>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-sm">Farmácia Boa Saúde</h3>
                                    <p className="text-xs text-muted-foreground">Atendimento via João (Agente)</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-500 text-xs font-semibold hover:bg-orange-500/20 transition-colors">
                                    Assumir Atendimento
                                </button>
                            </div>
                        </div>

                        {/* Chat History Panel */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-4">
                            <div className="flex justify-center">
                                <span className="px-3 py-1 rounded-full bg-secondary text-[10px] text-muted-foreground font-medium">Hoje</span>
                            </div>

                            <div className="flex justify-start">
                                <div className="bg-secondary text-foreground p-3 rounded-2xl rounded-tl-none max-w-[80%] text-sm border border-border shadow-sm">
                                    <p>Olá! Queria saber sobre as taxas que conversamos na visita de ontem.</p>
                                    <span className="text-[10px] text-muted-foreground block mt-1 text-right">10:42</span>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <div className="bg-[#00A868]/10 text-foreground p-3 rounded-2xl rounded-tr-none max-w-[80%] text-sm border border-[#00A868]/20 shadow-sm relative">
                                    <span className="absolute -top-4 right-0 text-[10px] text-muted-foreground">João (Agente)</span>
                                    <p>Bom dia! Tudo bem? A taxa que conseguimos chegar foi 1.86% no Crédito, conforme a simulação.</p>
                                    <span className="text-[10px] text-[#00A868]/80 block mt-1 text-right">10:44</span>
                                </div>
                            </div>

                            <div className="flex justify-start">
                                <div className="bg-secondary text-foreground p-3 rounded-2xl rounded-tl-none max-w-[80%] text-sm border border-border shadow-sm">
                                    <p>Sim, e a taxa no PIX ficaria quanto?</p>
                                    <span className="text-[10px] text-muted-foreground block mt-1 text-right">10:45</span>
                                </div>
                            </div>
                        </div>

                        {/* Chat Input */}
                        <div className="p-3 border-t border-border bg-secondary/50">
                            <div className="relative flex items-center">
                                <input 
                                    className="w-full bg-card border border-border rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-[#00A868]/50" 
                                    placeholder="⚠️ Você está em modo leitura. Clique em 'Assumir' para responder."
                                    disabled
                                />
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-card">
                        <div className="w-20 h-20 rounded-full bg-[#00A868]/10 flex items-center justify-center mb-4 border border-[#00A868]/20 relative">
                            <Smartphone className="w-10 h-10 text-[#00A868]" />
                            <div className="w-3 h-3 bg-green-500 rounded-full absolute bottom-1 right-1 border-2 border-card"></div>
                        </div>
                        <h2 className="text-xl font-bold mb-2">Central de Conexões API</h2>
                        <p className="text-muted-foreground max-w-sm mb-6 text-sm">
                            Utilizando a API BitCRM, você pode adicionar números de WhatsApp corporativos ou pessoais da equipe para auditar e gerir mensagens em tempo real.
                        </p>
                        <button className="px-6 py-3 bg-[#00A868] text-white rounded-xl font-bold shadow-lg hover:bg-[#008f58] transition-colors flex items-center gap-2">
                            <QrCode className="w-5 h-5" /> Adicionar Instância Evolution API
                        </button>

                        <div className="mt-12 text-left max-w-md w-full bg-secondary border border-border rounded-xl p-4">
                            <h4 className="text-xs font-bold text-muted-foreground uppercase mb-3 flex items-center gap-2">
                                <RefreshCcw className="w-3 h-3" /> Status da Integração
                            </h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between items-center pb-2 border-b border-border/50">
                                    <span>Webhooks API Base</span>
                                    <span className="text-green-500 font-medium">Ativos</span>
                                </div>
                                <div className="flex justify-between items-center pb-2 border-b border-border/50">
                                    <span>Puxar Histórico de Cliente</span>
                                    <span className="text-amber-500 font-medium">Buscando...</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span>Mensagens Sincronizadas (Hoje)</span>
                                    <span className="font-bold">1,244</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
        </div>
    );
}
