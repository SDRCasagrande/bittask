"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Users, UserPlus, X, ShieldCheck, ShieldOff,
    KeyRound, Trash2, Loader2, CheckCircle, AlertCircle,
    Mail
} from "lucide-react";

interface User {
    id: string;
    name: string;
    email: string;
    notificationEmail: string;
    isAdmin: boolean;
    isActive: boolean;
    createdAt: string;
}

export default function UsuariosPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNew, setShowNew] = useState(false);
    const [newName, setNewName] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [newPw, setNewPw] = useState("");
    const [newNotifEmail, setNewNotifEmail] = useState("");
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
    const [resetId, setResetId] = useState<string | null>(null);
    const [resetPw, setResetPw] = useState("");

    const load = useCallback(() => {
        fetch("/api/admin/users")
            .then((r) => r.json())
            .then((d) => { if (Array.isArray(d)) setUsers(d); })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { load(); }, [load]);

    const createUser = async () => {
        if (!newName.trim() || !newEmail.trim() || !newPw) {
            setMsg({ type: "err", text: "Preencha nome, email e senha" });
            return;
        }
        setSaving(true);
        setMsg(null);
        try {
            const res = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newName, email: newEmail, password: newPw, notificationEmail: newNotifEmail }),
            });
            const data = await res.json();
            if (res.ok) {
                setMsg({ type: "ok", text: `Usuário ${data.name} criado!` });
                setShowNew(false);
                setNewName(""); setNewEmail(""); setNewPw(""); setNewNotifEmail("");
                load();
            } else {
                setMsg({ type: "err", text: data.error || "Erro ao criar" });
            }
        } catch { setMsg({ type: "err", text: "Erro de conexão" }); }
        finally { setSaving(false); }
    };

    const toggleActive = async (user: User) => {
        try {
            await fetch(`/api/admin/users/${user.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !user.isActive }),
            });
            load();
        } catch { setMsg({ type: "err", text: "Erro ao alterar status" }); }
    };

    const resetPassword = async () => {
        if (!resetId || !resetPw || resetPw.length < 6) {
            setMsg({ type: "err", text: "Senha deve ter no mínimo 6 caracteres" });
            return;
        }
        try {
            const res = await fetch(`/api/admin/users/${resetId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ newPassword: resetPw }),
            });
            if (res.ok) {
                setMsg({ type: "ok", text: "Senha resetada!" });
                setResetId(null);
                setResetPw("");
            }
        } catch { setMsg({ type: "err", text: "Erro ao resetar senha" }); }
    };

    const deleteUser = async (id: string, name: string) => {
        if (!confirm(`Excluir ${name}? Todos os dados serão perdidos!`)) return;
        try {
            const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
            const data = await res.json();
            if (res.ok) { setMsg({ type: "ok", text: "Usuário excluído" }); load(); }
            else setMsg({ type: "err", text: data.error || "Erro" });
        } catch { setMsg({ type: "err", text: "Erro de conexão" }); }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-foreground">Gerenciar Usuários</h1>
                        <p className="text-xs text-muted-foreground">Total: {users.length} · {users.filter(u => u.isActive).length} ativos</p>
                    </div>
                </div>
                <button onClick={() => setShowNew(!showNew)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        showNew
                            ? "bg-muted text-muted-foreground hover:bg-muted/80"
                            : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20"
                    }`}>
                    {showNew ? <><X className="w-4 h-4" /> Cancelar</> : <><UserPlus className="w-4 h-4" /> Novo Usuário</>}
                </button>
            </div>

            {/* Message */}
            {msg && (
                <div className={`flex items-center gap-2 p-3 rounded-xl text-sm font-medium ${
                    msg.type === "ok"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                        : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                }`}>
                    {msg.type === "ok" ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                    {msg.text}
                </div>
            )}

            {/* New User Form */}
            {showNew && (
                <div className="bg-card border border-border rounded-2xl p-6">
                    <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-emerald-500" />
                        Criar Novo Usuário
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-muted-foreground font-medium mb-1">Nome *</label>
                            <input value={newName} onChange={(e) => setNewName(e.target.value)}
                                placeholder="João Silva" className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-xl text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-emerald-500/50 transition-colors" />
                        </div>
                        <div>
                            <label className="block text-xs text-muted-foreground font-medium mb-1">Email de login *</label>
                            <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
                                placeholder="joao@casa94.com" className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-xl text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-emerald-500/50 transition-colors" />
                        </div>
                        <div>
                            <label className="block text-xs text-muted-foreground font-medium mb-1">Senha *</label>
                            <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)}
                                placeholder="Mínimo 6 caracteres" className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-xl text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-emerald-500/50 transition-colors" />
                        </div>
                        <div>
                            <label className="block text-xs text-muted-foreground font-medium mb-1">Email de notificação</label>
                            <input type="email" value={newNotifEmail} onChange={(e) => setNewNotifEmail(e.target.value)}
                                placeholder="joao@gmail.com (opcional)" className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-xl text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-emerald-500/50 transition-colors" />
                        </div>
                    </div>
                    <button onClick={createUser} disabled={saving}
                        className="mt-4 flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-colors disabled:opacity-50">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        {saving ? "Criando..." : "Criar Usuário"}
                    </button>
                </div>
            )}

            {/* Reset Password Modal */}
            {resetId && (
                <div className="bg-card border border-amber-500/20 rounded-2xl p-6">
                    <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                        <KeyRound className="w-5 h-5 text-amber-500" />
                        Resetar Senha — {users.find(u => u.id === resetId)?.name}
                    </h2>
                    <div className="flex gap-3">
                        <input type="password" value={resetPw} onChange={(e) => setResetPw(e.target.value)}
                            placeholder="Nova senha (mín. 6 caracteres)" className="flex-1 px-4 py-2.5 bg-muted/50 border border-border rounded-xl text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-amber-500/50 transition-colors" />
                        <button onClick={resetPassword} className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-medium transition-colors">Salvar</button>
                        <button onClick={() => { setResetId(null); setResetPw(""); }} className="p-2.5 bg-muted hover:bg-muted/80 text-muted-foreground rounded-xl transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Users List */}
            <div className="space-y-3">
                {users.map((user) => (
                    <div key={user.id} className={`bg-card border rounded-2xl p-4 transition-all ${user.isActive ? "border-border" : "border-red-500/20 opacity-60"}`}>
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                                    user.isActive
                                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10"
                                        : "bg-red-500/10 text-red-500 border border-red-500/10"
                                }`}>
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-sm font-semibold text-foreground">{user.name}</p>
                                        {user.isAdmin && <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold">Admin</span>}
                                        {!user.isActive && <span className="text-[10px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full font-bold">Inativo</span>}
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                    {user.notificationEmail && (
                                        <p className="text-[10px] text-muted-foreground/70 flex items-center gap-1">
                                            <Mail className="w-3 h-3" /> {user.notificationEmail}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                                <button onClick={() => toggleActive(user)}
                                    className={`p-2 rounded-lg text-xs font-medium transition-all ${
                                        user.isActive
                                            ? "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
                                            : "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                                    }`}
                                    title={user.isActive ? "Desativar" : "Ativar"}>
                                    {user.isActive ? <ShieldOff className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                                </button>
                                <button onClick={() => { setResetId(user.id); setResetPw(""); }}
                                    className="p-2 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-all"
                                    title="Resetar senha">
                                    <KeyRound className="w-4 h-4" />
                                </button>
                                <button onClick={() => deleteUser(user.id, user.name)}
                                    className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all"
                                    title="Excluir usuário">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
