"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, X, Loader2, Minimize2, Maximize2, MessageSquare, Bot } from "lucide-react";

interface Message {
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}

const QUICK_QUESTIONS = [
    "Quais clientes estão em risco de churn?",
    "Sugira taxas competitivas para nova proposta",
    "Resuma meu pipeline atual",
    "Quais clientes devo priorizar essa semana?",
];

export default function LizzeChat() {
    const [open, setOpen] = useState(false);
    const [minimized, setMinimized] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "assistant",
            content: "Olá! 👋 Sou a **Lizze**, sua assistente de IA no BitTask. Posso ajudar com sugestões de taxas, análise de risco, estratégias de negociação e muito mais. Como posso te ajudar?",
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        if (open && !minimized) inputRef.current?.focus();
    }, [open, minimized]);

    const sendMessage = async (text?: string) => {
        const question = text || input.trim();
        if (!question || loading) return;

        const userMsg: Message = { role: "user", content: question, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question }),
            });
            const data = await res.json();
            const assistantMsg: Message = {
                role: "assistant",
                content: data.answer || "Desculpe, não consegui processar sua pergunta.",
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, assistantMsg]);
        } catch {
            setMessages(prev => [...prev, {
                role: "assistant",
                content: "❌ Erro de conexão. Tente novamente.",
                timestamp: new Date(),
            }]);
        }
        setLoading(false);
    };

    // Format markdown-like content
    const formatContent = (content: string) => {
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br/>')
            .replace(/- /g, '• ');
    };

    if (!open) {
        return (
            <button
                onClick={() => setOpen(true)}
                className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-40 w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 flex items-center justify-center transition-all hover:scale-105 active:scale-95 group"
                aria-label="Abrir Lizze IA"
            >
                <Sparkles className="w-6 h-6 group-hover:animate-pulse-subtle" />
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#00A868] border-2 border-card animate-pulse" />
            </button>
        );
    }

    if (minimized) {
        return (
            <div className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-40 flex items-center gap-2">
                <button onClick={() => setMinimized(false)}
                    className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all hover:scale-105">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm font-bold">Lizze</span>
                    {messages.length > 1 && <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">{messages.length}</span>}
                </button>
                <button onClick={() => setOpen(false)} className="p-2 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground shadow-lg">
                    <X className="w-4 h-4" />
                </button>
            </div>
        );
    }

    return (
        <div className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-40 w-[360px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-8rem)] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-in">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                        <Bot className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold">Lizze IA</h3>
                        <p className="text-[9px] text-white/70">Assistente BitTask · Gemini</p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={() => setMinimized(true)} className="p-1.5 rounded-lg hover:bg-white/10">
                        <Minimize2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10">
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                            msg.role === "user"
                                ? "bg-[#00A868] text-white rounded-br-md"
                                : "bg-secondary text-foreground rounded-bl-md"
                        }`}>
                            {msg.role === "assistant" ? (
                                <div dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }} />
                            ) : (
                                msg.content
                            )}
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-500" />
                            <span className="text-[12px] text-muted-foreground">Lizze está pensando...</span>
                        </div>
                    </div>
                )}

                {/* Quick questions (only if no user messages yet) */}
                {messages.length === 1 && !loading && (
                    <div className="space-y-1.5 pt-2">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider px-1">Perguntas rápidas</p>
                        {QUICK_QUESTIONS.map((q, i) => (
                            <button key={i} onClick={() => sendMessage(q)}
                                className="w-full text-left px-3 py-2 rounded-xl bg-purple-500/5 border border-purple-500/10 text-[12px] text-foreground hover:bg-purple-500/10 hover:border-purple-500/20 transition-all">
                                {q}
                            </button>
                        ))}
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="shrink-0 px-3 py-3 border-t border-border bg-card">
                <div className="flex items-center gap-2">
                    <input
                        ref={inputRef}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && sendMessage()}
                        placeholder="Pergunte à Lizze..."
                        disabled={loading}
                        className="flex-1 px-3.5 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder-muted-foreground/50 focus:outline-none focus:border-purple-500/50 disabled:opacity-50"
                    />
                    <button
                        onClick={() => sendMessage()}
                        disabled={!input.trim() || loading}
                        className="p-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white disabled:opacity-30 hover:shadow-lg hover:shadow-purple-500/20 transition-all"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
                <p className="text-[9px] text-muted-foreground/50 text-center mt-1.5">Powered by Gemini · Contexto da sua carteira incluído</p>
            </div>
        </div>
    );
}
