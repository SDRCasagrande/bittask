"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
    CheckSquare, Plus, Circle, CheckCircle2, Calendar, Star, LogOut,
    ListTodo, Users, ChevronRight, Trash2, Clock, Flag, Check, X,
    Loader2, User
} from "lucide-react";

interface UserOption { id: string; name: string; email: string }
interface TaskData {
    id: string; title: string; description: string; completed: boolean; date: string; time: string;
    starred: boolean; priority: string; listId: string; createdById: string;
    assigneeId: string | null; assignee: UserOption | null;
    createdBy: { id: string; name: string }; createdAt: string;
    group?: { id: string; name: string } | null;
}
interface TaskListData { id: string; name: string; tasks: TaskData[] }
interface TeamGroup { id: string; name: string; members: { id: string; user: { id: string; name: string } }[]; _count: { tasks: number } }

function today() { return new Date().toISOString().split("T")[0]; }
function friendlyDate(d: string) {
    if (!d) return "";
    const t = new Date(); const todayStr = t.toISOString().split("T")[0];
    t.setDate(t.getDate() + 1); const tomorrowStr = t.toISOString().split("T")[0];
    if (d === todayStr) return "Hoje";
    if (d === tomorrowStr) return "Amanhã";
    return new Date(d + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
}
function isOverdue(d: string) { return d ? d < today() : false; }

const PRI_MAP: Record<string, { label: string; color: string; dot: string }> = {
    high: { label: "Alta", color: "text-red-400", dot: "bg-red-500" },
    medium: { label: "Média", color: "text-amber-400", dot: "bg-amber-500" },
    low: { label: "Baixa", color: "text-blue-400", dot: "bg-blue-500" },
};

export default function BitTasksApp() {
    const [lists, setLists] = useState<TaskListData[]>([]);
    const [assignedToMe, setAssignedToMe] = useState<TaskData[]>([]);
    const [groupTasks, setGroupTasks] = useState<TaskData[]>([]);
    const [teams, setTeams] = useState<TeamGroup[]>([]);
    const [users, setUsers] = useState<UserOption[]>([]);
    const [currentUser, setCurrentUser] = useState<{ id: string; name: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<"tasks" | "assigned" | "team">("tasks");
    const [detailTask, setDetailTask] = useState<TaskData | null>(null);
    const [addingTitle, setAddingTitle] = useState("");
    const [showAdd, setShowAdd] = useState(false);

    const load = useCallback(async () => {
        try {
            const [tasksRes, usersRes, meRes] = await Promise.all([
                fetch("/api/tasks"), fetch("/api/admin/users"), fetch("/api/auth/me"),
            ]);
            const tasksData = await tasksRes.json();
            const usersData = await usersRes.json();
            const meData = await meRes.json();
            if (tasksData.lists) setLists(tasksData.lists);
            if (tasksData.assignedTasks) setAssignedToMe(tasksData.assignedTasks);
            if (tasksData.groupTasks) setGroupTasks(tasksData.groupTasks);
            if (tasksData.teams) setTeams(tasksData.teams);
            if (Array.isArray(usersData)) setUsers(usersData);
            if (meData?.id) setCurrentUser({ id: meData.id, name: meData.name });
        } catch { /* */ } finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const allMyTasks = useMemo(() => lists.flatMap(l => l.tasks), [lists]);
    const pendingTasks = allMyTasks.filter(t => !t.completed);
    const todayTasks = pendingTasks.filter(t => t.date === today());
    const starredTasks = pendingTasks.filter(t => t.starred);

    async function toggleTask(id: string) {
        const task = [...allMyTasks, ...assignedToMe, ...groupTasks].find(t => t.id === id);
        if (!task) return;
        await fetch(`/api/tasks/item/${id}`, {
            method: "PUT", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ completed: !task.completed }),
        });
        load();
    }

    async function addTask() {
        if (!addingTitle.trim() || !lists[0]) return;
        await fetch(`/api/tasks/${lists[0].id}/items`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: addingTitle.trim(), date: today() }),
        });
        setAddingTitle(""); setShowAdd(false); load();
    }

    async function deleteTask(id: string) {
        await fetch(`/api/tasks/item/${id}`, { method: "DELETE" });
        setDetailTask(null); load();
    }

    async function updateTask(id: string, data: Record<string, any>) {
        await fetch(`/api/tasks/item/${id}`, {
            method: "PUT", headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        load();
    }

    if (loading) return (
        <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
    );

    const displayTasks = tab === "tasks" ? pendingTasks
        : tab === "assigned" ? assignedToMe.filter(t => !t.completed)
        : groupTasks.filter(t => !t.completed);

    return (
        <>
            {/* Header */}
            <header className="shrink-0 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800 px-4 py-3 safe-area-top">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <CheckSquare className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h1 className="text-base font-bold text-white">BitTasks</h1>
                            <p className="text-[10px] text-slate-400">{currentUser?.name}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="bg-indigo-500/10 rounded-lg px-2.5 py-1">
                            <span className="text-xs font-bold text-indigo-400">{pendingTasks.length} pendentes</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Tab Bar */}
            <div className="shrink-0 bg-slate-900/50 border-b border-slate-800 px-4">
                <div className="flex gap-1">
                    {[
                        { id: "tasks" as const, label: "Minhas", icon: ListTodo, count: pendingTasks.length },
                        { id: "assigned" as const, label: "Atribuídas", icon: User, count: assignedToMe.filter(t => !t.completed).length },
                        { id: "team" as const, label: "Equipe", icon: Users, count: groupTasks.filter(t => !t.completed).length },
                    ].map(t => (
                        <button key={t.id} onClick={() => setTab(t.id)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold border-b-2 transition-all ${
                                tab === t.id
                                    ? "border-indigo-500 text-indigo-400"
                                    : "border-transparent text-slate-500 hover:text-slate-300"
                            }`}>
                            <t.icon className="w-3.5 h-3.5" />
                            {t.label}
                            {t.count > 0 && (
                                <span className={`text-[9px] min-w-[16px] h-4 flex items-center justify-center rounded-full px-1 ${
                                    tab === t.id ? "bg-indigo-500/20 text-indigo-400" : "bg-slate-800 text-slate-400"
                                }`}>{t.count}</span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Quick Stats */}
            {tab === "tasks" && (
                <div className="shrink-0 px-4 py-3 flex gap-2 overflow-x-auto">
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl px-3 py-2 flex items-center gap-2 shrink-0">
                        <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                        <div><p className="text-[9px] text-slate-400">Hoje</p><p className="text-sm font-bold text-white">{todayTasks.length}</p></div>
                    </div>
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl px-3 py-2 flex items-center gap-2 shrink-0">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <div><p className="text-[9px] text-slate-400">Favoritas</p><p className="text-sm font-bold text-white">{starredTasks.length}</p></div>
                    </div>
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl px-3 py-2 flex items-center gap-2 shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <div><p className="text-[9px] text-slate-400">Concluídas</p><p className="text-sm font-bold text-white">{allMyTasks.filter(t => t.completed).length}</p></div>
                    </div>
                </div>
            )}

            {/* Tasks List */}
            <div className="flex-1 overflow-y-auto px-4 pb-24">
                {displayTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                        <CheckSquare className="w-12 h-12 mb-3 opacity-30" />
                        <p className="text-sm font-medium">Nenhuma tarefa pendente</p>
                        <p className="text-xs mt-1">Toque + para criar uma nova</p>
                    </div>
                ) : (
                    <div className="space-y-2 py-2">
                        {displayTasks.map(task => {
                            const pri = PRI_MAP[task.priority] || PRI_MAP.medium;
                            return (
                                <div key={task.id}
                                    className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-3 flex items-start gap-3 active:bg-slate-800/60 transition-colors"
                                    onClick={() => setDetailTask(task)}>
                                    <button onClick={e => { e.stopPropagation(); toggleTask(task.id); }}
                                        className="mt-0.5 shrink-0">
                                        {task.completed
                                            ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                            : <Circle className="w-5 h-5 text-slate-500" />}
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium ${task.completed ? "line-through text-slate-500" : "text-white"}`}>
                                            {task.title}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                            <span className={`w-1.5 h-1.5 rounded-full ${pri.dot}`} />
                                            {task.date && (
                                                <span className={`text-[10px] ${isOverdue(task.date) ? "text-red-400" : "text-slate-400"}`}>
                                                    {friendlyDate(task.date)}
                                                </span>
                                            )}
                                            {task.assignee && (
                                                <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                                                    {task.assignee.name.split(" ")[0]}
                                                </span>
                                            )}
                                            {task.group && (
                                                <span className="text-[10px] text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">
                                                    {task.group.name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {task.starred && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />}
                                    <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* FAB Add */}
            <button onClick={() => setShowAdd(true)}
                className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 shadow-xl shadow-indigo-500/30 flex items-center justify-center z-40 active:scale-95 transition-transform">
                <Plus className="w-6 h-6 text-white" />
            </button>

            {/* Add Task Modal */}
            {showAdd && (
                <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setShowAdd(false)}>
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                    <div className="relative w-full max-w-lg bg-slate-900 border-t border-slate-700 rounded-t-2xl p-5 animate-in slide-in-from-bottom duration-200"
                        onClick={e => e.stopPropagation()}>
                        <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-4" />
                        <h3 className="text-sm font-bold text-white mb-3">Nova Tarefa</h3>
                        <input value={addingTitle} onChange={e => setAddingTitle(e.target.value)} autoFocus
                            placeholder="O que precisa ser feito?" onKeyDown={e => { if (e.key === "Enter") addTask(); }}
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                        <div className="flex gap-2 mt-3">
                            <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-sm font-medium">Cancelar</button>
                            <button onClick={addTask} disabled={!addingTitle.trim()}
                                className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold disabled:opacity-50">Criar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Task Detail Modal */}
            {detailTask && (
                <TaskDetailModal task={detailTask} users={users} teams={teams}
                    onUpdate={(data) => { updateTask(detailTask.id, data); setDetailTask({ ...detailTask, ...data }); }}
                    onDelete={() => deleteTask(detailTask.id)}
                    onClose={() => setDetailTask(null)} />
            )}
        </>
    );
}

/* ═══ TASK DETAIL MODAL ═══ */
function TaskDetailModal({ task, users, teams, onUpdate, onDelete, onClose }: {
    task: TaskData; users: UserOption[]; teams: TeamGroup[];
    onUpdate: (data: Record<string, any>) => void; onDelete: () => void; onClose: () => void;
}) {
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description || "");
    const [priority, setPriority] = useState(task.priority || "medium");
    const [date, setDate] = useState(task.date);
    const [time, setTime] = useState(task.time);
    const [assigneeId, setAssigneeId] = useState(task.assigneeId || "");
    const [saved, setSaved] = useState(false);
    const [dirty, setDirty] = useState(false);
    const mark = () => { if (!dirty) setDirty(true); };

    function handleSave() {
        const updates: Record<string, any> = {};
        if (title.trim() && title !== task.title) updates.title = title.trim();
        if (description !== (task.description || "")) updates.description = description;
        if (priority !== task.priority) updates.priority = priority;
        if (date !== task.date) updates.date = date;
        if (time !== task.time) updates.time = time;
        const na = assigneeId || null;
        if (na !== task.assigneeId) updates.assigneeId = na;
        if (Object.keys(updates).length > 0) onUpdate(updates);
        setSaved(true); setDirty(false);
        setTimeout(() => setSaved(false), 2000);
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <div className="relative w-full max-w-md max-h-[85vh] bg-slate-900 border border-slate-700 rounded-2xl flex flex-col animate-in zoom-in-95 fade-in duration-200"
                onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 shrink-0">
                    <div className="flex items-center gap-2">
                        <button onClick={() => onUpdate({ completed: !task.completed })}
                            className={task.completed ? "text-emerald-500" : "text-slate-400"}>
                            {task.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                        </button>
                        <span className="text-sm font-bold text-white">Detalhes</span>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400"><X className="w-4 h-4" /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <input value={title} onChange={e => { setTitle(e.target.value); mark(); }}
                        className="w-full text-lg font-bold text-white bg-transparent border-b border-slate-700 focus:border-indigo-500 focus:outline-none pb-1" />

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-slate-400">Prioridade</label>
                            <select value={priority} onChange={e => { setPriority(e.target.value); mark(); }}
                                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none">
                                <option value="high">🔴 Alta</option>
                                <option value="medium">🟡 Média</option>
                                <option value="low">🔵 Baixa</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-slate-400">Responsável</label>
                            <select value={assigneeId} onChange={e => { setAssigneeId(e.target.value); mark(); }}
                                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none">
                                <option value="">Sem responsável</option>
                                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-slate-400">Data</label>
                            <input type="date" value={date} onChange={e => { setDate(e.target.value); mark(); }}
                                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none [color-scheme:dark]" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-slate-400">Horário</label>
                            <input type="time" value={time} onChange={e => { setTime(e.target.value); mark(); }}
                                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none [color-scheme:dark]" />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-400">Notas</label>
                        <textarea value={description} onChange={e => { setDescription(e.target.value); mark(); }}
                            rows={3} placeholder="Detalhes..."
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none resize-none" />
                    </div>

                    <div className="space-y-1 pt-2 border-t border-slate-800">
                        <p className="text-[10px] text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(task.createdAt).toLocaleString("pt-BR")}</p>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1"><User className="w-3 h-3" /> {task.createdBy.name}</p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800 shrink-0">
                    <div className="flex gap-2">
                        <button onClick={() => onUpdate({ starred: !task.starred })}
                            className={`p-2 rounded-lg ${task.starred ? "bg-amber-500/10 text-amber-400" : "bg-slate-800 text-slate-400"}`}>
                            <Star className={`w-4 h-4 ${task.starred ? "fill-amber-400" : ""}`} />
                        </button>
                        <button onClick={() => { if (confirm("Excluir?")) onDelete(); }}
                            className="p-2 rounded-lg bg-red-500/10 text-red-400">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                    <button onClick={handleSave}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 shadow-lg ${
                            saved ? "bg-emerald-500 text-white scale-105 shadow-emerald-500/30"
                                : dirty ? "bg-indigo-600 hover:bg-indigo-500 text-white animate-pulse shadow-indigo-600/20"
                                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20"
                        }`}>
                        {saved ? <><Check className="w-4 h-4" /> Salvo!</> : <><Check className="w-4 h-4" /> Salvar</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
