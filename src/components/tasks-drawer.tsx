"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckSquare, Plus, Trash2, X, Circle, CheckCircle2, Calendar, Loader2 } from "lucide-react";
import Link from "next/link";

interface TaskData {
    id: string; title: string; completed: boolean; date: string; time: string;
    starred: boolean; scheduled: boolean;
    assignee: { id: string; name: string } | null;
}
interface TaskListData { id: string; name: string; tasks: TaskData[] }

export function TasksDrawer() {
    const [isOpen, setIsOpen] = useState(false);
    const [lists, setLists] = useState<TaskListData[]>([]);
    const [loading, setLoading] = useState(false);
    const [newTask, setNewTask] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/tasks");
            const data = await res.json();
            if (data.lists) setLists(data.lists);
        } catch { /* */ } finally { setLoading(false); }
    }, []);

    useEffect(() => { if (isOpen) load(); }, [isOpen, load]);

    const addTask = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!newTask.trim() || lists.length === 0) return;
        try {
            await fetch(`/api/tasks/${lists[0].id}/items`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: newTask.trim() }),
            });
            setNewTask("");
            load();
        } catch { /* */ }
    };

    const toggleTask = async (id: string, completed: boolean) => {
        try {
            await fetch(`/api/tasks/item/${id}`, {
                method: "PUT", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ completed: !completed }),
            });
            load();
        } catch { /* */ }
    };

    const allTasks = lists.flatMap(l => l.tasks);
    const pendingCount = allTasks.filter(t => !t.completed).length;
    const completedCount = allTasks.filter(t => t.completed).length;

    return (
        <>
            <button onClick={() => setIsOpen(true)} className="relative p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground flex items-center justify-center">
                <CheckSquare className="w-5 h-5" />
                {pendingCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-card" />}
            </button>

            {isOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" onClick={() => setIsOpen(false)} />}

            <div className={`fixed top-0 right-0 h-screen w-full sm:w-[400px] bg-card border-l border-border z-[101] shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
                <div className="h-16 flex items-center justify-between px-5 border-b border-border shrink-0 bg-secondary/30">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-500 flex items-center justify-center">
                            <CheckSquare className="w-4 h-4" />
                        </div>
                        <div>
                            <h2 className="font-bold text-foreground">Minhas Tarefas</h2>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{pendingCount} pendentes • {completedCount} concluídas</p>
                        </div>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>

                <div className="p-4 border-b border-border shrink-0">
                    <form onSubmit={addTask} className="relative">
                        <input type="text" placeholder="Adicionar nova tarefa..." value={newTask} onChange={(e) => setNewTask(e.target.value)}
                            className="w-full pl-4 pr-10 py-3 rounded-xl bg-secondary border border-border text-sm focus:ring-2 focus:ring-emerald-500 text-foreground" />
                        <button type="submit" disabled={!newTask.trim()}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-500/10 disabled:opacity-50 transition-colors">
                            <Plus className="w-4 h-4" />
                        </button>
                    </form>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {loading ? (
                        <div className="h-full flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-emerald-500" /></div>
                    ) : allTasks.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-3 opacity-50">
                            <CheckSquare className="w-12 h-12" />
                            <p className="text-sm">Nenhuma tarefa pendente.</p>
                        </div>
                    ) : (
                        allTasks
                            .sort((a, b) => Number(a.completed) - Number(b.completed))
                            .slice(0, 20)
                            .map(task => (
                                <div key={task.id} className={`group flex items-center justify-between gap-2 p-3 rounded-xl transition-all ${task.completed ? "opacity-60" : "bg-secondary hover:bg-secondary/80"}`}>
                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                        <button onClick={() => toggleTask(task.id, task.completed)} className="shrink-0 mt-0.5 text-muted-foreground hover:text-emerald-500">
                                            {task.completed ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5" />}
                                        </button>
                                        <div className="min-w-0">
                                            <span className={`text-sm block truncate ${task.completed ? "line-through text-muted-foreground" : "text-foreground font-medium"}`}>{task.title}</span>
                                            {task.date && !task.completed && (
                                                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 mt-0.5">
                                                    <Calendar className="w-3 h-3" /> {task.date}{task.time && ` · ${task.time}`}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                    )}
                </div>

                <div className="p-3 border-t border-border shrink-0">
                    <Link href="/dashboard/tarefas" onClick={() => setIsOpen(false)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium transition-colors">
                        <CheckSquare className="w-4 h-4" /> Ver todas as tarefas
                    </Link>
                </div>
            </div>
        </>
    );
}
