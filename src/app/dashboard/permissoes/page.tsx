"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Shield, Plus, X, Save, Loader2, CheckCircle, AlertCircle,
    Trash2, Users, ChevronDown, ChevronUp
} from "lucide-react";
import { PERMISSIONS, PermissionKey } from "@/lib/permissions";

interface RolePermission {
    id: string;
    permission: string;
}

interface Role {
    id: string;
    name: string;
    description: string;
    permissions: RolePermission[];
    _count: { users: number };
}

const PERM_GROUPS: Record<string, PermissionKey[]> = {
    "Ferramentas": ["dashboard.view", "cet.use", "simulator.use", "comparator.use", "tasks.use"],
    "Clientes & Negociações": ["clients.view", "clients.manage", "negotiations.view", "negotiations.manage"],
    "Administração": ["users.view", "users.manage", "roles.manage", "settings.view", "reports.export"],
};

export default function PermissoesPage() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNew, setShowNew] = useState(false);
    const [newName, setNewName] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [newPerms, setNewPerms] = useState<Set<string>>(new Set());
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [editPerms, setEditPerms] = useState<Set<string>>(new Set());

    const load = useCallback(() => {
        fetch("/api/admin/roles")
            .then((r) => r.json())
            .then((d) => { if (Array.isArray(d)) setRoles(d); })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { load(); }, [load]);

    const createRole = async () => {
        if (!newName.trim()) { setMsg({ type: "err", text: "Nome é obrigatório" }); return; }
        setSaving(true);
        setMsg(null);
        try {
            const res = await fetch("/api/admin/roles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newName, description: newDesc, permissions: [...newPerms] }),
            });
            const data = await res.json();
            if (res.ok) {
                setMsg({ type: "ok", text: `Cargo "${data.name}" criado!` });
                setShowNew(false); setNewName(""); setNewDesc(""); setNewPerms(new Set());
                load();
            } else { setMsg({ type: "err", text: data.error || "Erro" }); }
        } catch { setMsg({ type: "err", text: "Erro de conexão" }); }
        finally { setSaving(false); }
    };

    const updateRole = async (role: Role) => {
        setSaving(true);
        setMsg(null);
        try {
            const res = await fetch(`/api/admin/roles/${role.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: role.name, description: role.description, permissions: [...editPerms] }),
            });
            if (res.ok) {
                setMsg({ type: "ok", text: `Cargo "${role.name}" atualizado!` });
                setExpandedId(null);
                load();
            } else {
                const data = await res.json();
                setMsg({ type: "err", text: data.error || "Erro" });
            }
        } catch { setMsg({ type: "err", text: "Erro de conexão" }); }
        finally { setSaving(false); }
    };

    const deleteRole = async (role: Role) => {
        if (!confirm(`Excluir o cargo "${role.name}"?`)) return;
        try {
            const res = await fetch(`/api/admin/roles/${role.id}`, { method: "DELETE" });
            const data = await res.json();
            if (res.ok) { setMsg({ type: "ok", text: "Cargo excluído" }); load(); }
            else setMsg({ type: "err", text: data.error || "Erro" });
        } catch { setMsg({ type: "err", text: "Erro de conexão" }); }
    };

    const toggleExpand = (role: Role) => {
        if (expandedId === role.id) { setExpandedId(null); return; }
        setExpandedId(role.id);
        setEditPerms(new Set(role.permissions.map(p => p.permission)));
    };

    const togglePerm = (set: Set<string>, setFn: (s: Set<string>) => void, perm: string) => {
        const n = new Set(set);
        if (n.has(perm)) n.delete(perm); else n.add(perm);
        setFn(n);
    };

    const PermGrid = ({ perms, setPerms }: { perms: Set<string>; setPerms: (s: Set<string>) => void }) => (
        <div className="space-y-4">
            {Object.entries(PERM_GROUPS).map(([group, keys]) => (
                <div key={group}>
                    <p className="text-[11px] font-bold uppercase text-muted-foreground mb-2 tracking-wide">{group}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {keys.map(key => (
                            <label key={key}
                                className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all text-sm ${
                                    perms.has(key) ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600" : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/50"
                                }`}
                            >
                                <input type="checkbox" checked={perms.has(key)} onChange={() => togglePerm(perms, setPerms, key)}
                                    className="sr-only" />
                                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                                    perms.has(key) ? "bg-emerald-500 border-emerald-500" : "border-muted-foreground/30"
                                }`}>
                                    {perms.has(key) && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                </div>
                                {PERMISSIONS[key]}
                            </label>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );

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
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-foreground">Cargos & Permissões</h1>
                        <p className="text-xs text-muted-foreground">{roles.length} cargos cadastrados</p>
                    </div>
                </div>
                <button onClick={() => setShowNew(!showNew)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        showNew ? "bg-muted text-muted-foreground" : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20"
                    }`}>
                    {showNew ? <><X className="w-4 h-4" /> Cancelar</> : <><Plus className="w-4 h-4" /> Novo Cargo</>}
                </button>
            </div>

            {/* Message */}
            {msg && (
                <div className={`flex items-center gap-2 p-3 rounded-xl text-sm font-medium ${
                    msg.type === "ok" ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-red-500/10 text-red-600 border border-red-500/20"
                }`}>
                    {msg.type === "ok" ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                    {msg.text}
                </div>
            )}

            {/* New Role Form */}
            {showNew && (
                <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2"><Plus className="w-5 h-5 text-emerald-500" /> Criar Novo Cargo</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-muted-foreground font-medium mb-1">Nome *</label>
                            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ex: Consultor Sênior"
                                className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-xl text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-emerald-500/50 transition-colors" />
                        </div>
                        <div>
                            <label className="block text-xs text-muted-foreground font-medium mb-1">Descrição</label>
                            <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Breve descrição do cargo"
                                className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-xl text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-emerald-500/50 transition-colors" />
                        </div>
                    </div>
                    <PermGrid perms={newPerms} setPerms={setNewPerms} />
                    <button onClick={createRole} disabled={saving}
                        className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-colors disabled:opacity-50">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        {saving ? "Criando..." : "Criar Cargo"}
                    </button>
                </div>
            )}

            {/* Roles List */}
            <div className="space-y-3">
                {roles.map((role) => (
                    <div key={role.id} className="bg-card border border-border rounded-2xl overflow-hidden transition-all">
                        <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => toggleExpand(role)}>
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 border border-purple-500/10 flex items-center justify-center shrink-0">
                                    <Shield className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-sm font-semibold text-foreground">{role.name}</p>
                                        <span className="text-[10px] bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                            <Users className="w-3 h-3" /> {role._count.users}
                                        </span>
                                        <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                                            {role.permissions.length} permissões
                                        </span>
                                    </div>
                                    {role.description && <p className="text-xs text-muted-foreground truncate">{role.description}</p>}
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                                <button onClick={(e) => { e.stopPropagation(); deleteRole(role); }}
                                    className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                {expandedId === role.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                            </div>
                        </div>

                        {/* Expanded Permissions Editor */}
                        {expandedId === role.id && (
                            <div className="p-4 pt-0 border-t border-border space-y-4">
                                <PermGrid perms={editPerms} setPerms={setEditPerms} />
                                <button onClick={() => updateRole(role)} disabled={saving}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-medium transition-colors disabled:opacity-50">
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    {saving ? "Salvando..." : "Salvar Permissões"}
                                </button>
                            </div>
                        )}
                    </div>
                ))}

                {roles.length === 0 && (
                    <div className="text-center py-16 text-muted-foreground">
                        <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">Nenhum cargo cadastrado. Crie o primeiro!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
