"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Users, Handshake, CheckSquare, ArrowRight, Command, X } from "lucide-react";

interface SearchResult {
    type: "client" | "negotiation" | "task";
    id: string;
    title: string;
    subtitle?: string;
    href: string;
}

export default function CommandPalette() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    // Ctrl+K / Cmd+K toggle
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if ((e.ctrlKey || e.metaKey) && e.key === "k") {
                e.preventDefault();
                setOpen(prev => !prev);
            }
            if (e.key === "Escape") setOpen(false);
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Auto-focus input
    useEffect(() => {
        if (open) {
            setQuery("");
            setResults([]);
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [open]);

    // Debounced search
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const doSearch = useCallback(async (q: string) => {
        if (q.length < 2) { setResults([]); return; }
        setLoading(true);
        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
            if (res.ok) {
                const data = await res.json();
                setResults(data.results || []);
                setSelectedIndex(0);
            }
        } catch { /* */ }
        setLoading(false);
    }, []);

    useEffect(() => {
        clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => doSearch(query), 250);
        return () => clearTimeout(searchTimeout.current);
    }, [query, doSearch]);

    function navigate(result: SearchResult) {
        setOpen(false);
        router.push(result.href);
    }

    function handleKeyNav(e: React.KeyboardEvent) {
        if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, results.length - 1)); }
        if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
        if (e.key === "Enter" && results[selectedIndex]) { e.preventDefault(); navigate(results[selectedIndex]); }
    }

    const iconMap = { client: Users, negotiation: Handshake, task: CheckSquare };
    const labelMap = { client: "Cliente", negotiation: "Negociação", task: "Tarefa" };
    const colorMap = { client: "text-[#00A868]", negotiation: "text-blue-500", task: "text-purple-500" };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]" onClick={() => setOpen(false)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="relative w-full max-w-lg mx-4 card-elevated shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200" onClick={e => e.stopPropagation()}>
                {/* Search Input */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                    <Search className="w-5 h-5 text-muted-foreground shrink-0" />
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={handleKeyNav}
                        placeholder="Buscar clientes, negociações, tarefas..."
                        className="flex-1 bg-transparent text-foreground text-sm focus:outline-none placeholder:text-muted-foreground/50"
                    />
                    <div className="flex items-center gap-1 shrink-0">
                        {query && (
                            <button onClick={() => setQuery("")} className="p-1 rounded hover:bg-muted text-muted-foreground">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono text-muted-foreground border border-border">
                            ESC
                        </kbd>
                    </div>
                </div>

                {/* Results */}
                <div className="max-h-[50vh] overflow-y-auto">
                    {loading && (
                        <div className="flex items-center justify-center py-8">
                            <div className="w-5 h-5 border-2 border-[#00A868] border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}

                    {!loading && query.length >= 2 && results.length === 0 && (
                        <div className="py-8 text-center">
                            <p className="text-sm text-muted-foreground">Nenhum resultado para &quot;{query}&quot;</p>
                        </div>
                    )}

                    {!loading && results.length > 0 && (
                        <div className="py-1">
                            {results.map((r, i) => {
                                const Icon = iconMap[r.type];
                                return (
                                    <button key={`${r.type}-${r.id}`} onClick={() => navigate(r)}
                                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${i === selectedIndex ? "bg-[#00A868]/10" : "hover:bg-muted/50"}`}>
                                        <div className={`w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0`}>
                                            <Icon className={`w-4 h-4 ${colorMap[r.type]}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate">{r.title}</p>
                                            {r.subtitle && <p className="text-[11px] text-muted-foreground truncate">{r.subtitle}</p>}
                                        </div>
                                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${colorMap[r.type]} bg-muted`}>
                                            {labelMap[r.type]}
                                        </span>
                                        {i === selectedIndex && <ArrowRight className="w-3.5 h-3.5 text-[#00A868] shrink-0" />}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {!loading && query.length < 2 && (
                        <div className="py-6 text-center space-y-2">
                            <p className="text-sm text-muted-foreground">Digite para buscar...</p>
                            <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground/50">
                                <span>↑↓ navegar</span>
                                <span>↵ abrir</span>
                                <span>esc fechar</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
