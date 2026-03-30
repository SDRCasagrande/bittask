"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, CheckSquare } from "lucide-react";

export default function TasksLoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || "Erro ao fazer login"); return; }
            router.push("/tasks");
        } catch { setError("Erro de conexão"); }
        finally { setLoading(false); }
    }

    return (
        <div className="min-h-[100dvh] flex items-center justify-center bg-slate-950 relative overflow-hidden px-4">
            {/* Background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl" />
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-sm">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 mb-4">
                        <CheckSquare className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">BitTasks</h1>
                    <p className="text-slate-400 mt-2 text-sm">
                        Tarefas da equipe — BitKaiser Solution
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">E-mail</label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                placeholder="seu@email.com" required
                                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Senha</label>
                            <div className="relative">
                                <input type={showPassword ? "text" : "password"} value={password}
                                    onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required
                                    className="w-full pl-4 pr-12 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1">
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">{error}</div>
                        )}

                        <button type="submit" disabled={loading}
                            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold
                                hover:from-indigo-500 hover:to-purple-500 active:scale-[0.98] disabled:opacity-60
                                transition-all duration-200 shadow-lg shadow-indigo-500/20">
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Entrando...
                                </span>
                            ) : "Entrar"}
                        </button>
                    </form>
                </div>

                <p className="text-center text-xs text-slate-500 mt-6">
                    Powered by <span className="font-semibold text-slate-400">BKaiser Solution</span>
                </p>
            </div>
        </div>
    );
}
