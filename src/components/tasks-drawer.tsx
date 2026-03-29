"use client";

import { useState, useEffect } from "react";
import { CheckSquare, Plus, Trash2, X, Circle, CheckCircle2, Calendar } from "lucide-react";

interface Task {
    id: string;
    title: string;
    completed: boolean;
    createdAt: number;
}

const STORAGE_KEY = "bitkaiser_tasks";

export function TasksDrawer() {
    const [isOpen, setIsOpen] = useState(false);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [newTask, setNewTask] = useState("");

    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) setTasks(JSON.parse(saved));
        } catch { /* ignore */ }
    }, []);

    useEffect(() => {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); } catch { /* ignore */ }
    }, [tasks]);

    const addTask = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!newTask.trim()) return;
        setTasks([{ id: crypto.randomUUID(), title: newTask.trim(), completed: false, createdAt: Date.now() }, ...tasks]);
        setNewTask("");
    };

    const toggleTask = (id: string) => {
        setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    };

    const deleteTask = (id: string) => {
        setTasks(tasks.filter(t => t.id !== id));
    };

    const scheduleTask = (task: Task) => {
        const title = encodeURIComponent(task.title);
        const url = `https://calendar.google.com/calendar/r/eventedit?text=${title}&details=${encodeURIComponent("Tarefa do BitKaiser Taxas")}`;
        window.open(url, "_blank");
    };

    const completedCount = tasks.filter(t => t.completed).length;
    const pendingCount = tasks.length - completedCount;

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="relative p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground flex items-center justify-center"
            >
                <CheckSquare className="w-5 h-5" />
                {pendingCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-card" />
                )}
            </button>

            {/* Overlay */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Drawer */}
            <div className={`fixed top-0 right-0 h-screen w-full sm:w-[400px] bg-card border-l border-border z-[101] shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
                {/* Header */}
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

                {/* Task Input */}
                <div className="p-4 border-b border-border shrink-0">
                    <form onSubmit={addTask} className="relative">
                        <input 
                            type="text" 
                            placeholder="Adicionar nova tarefa..." 
                            value={newTask}
                            onChange={(e) => setNewTask(e.target.value)}
                            className="w-full pl-4 pr-10 py-3 rounded-xl bg-secondary border border-border text-sm focus:ring-2 focus:ring-emerald-500 text-foreground"
                        />
                        <button 
                            type="submit"
                            disabled={!newTask.trim()}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-500/10 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </form>
                </div>

                {/* Task List */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {tasks.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-3 opacity-50">
                            <CheckSquare className="w-12 h-12" />
                            <p className="text-sm">Nenhuma tarefa pendente.</p>
                        </div>
                    ) : (
                        tasks.sort((a, b) => Number(a.completed) - Number(b.completed) || b.createdAt - a.createdAt).map(task => (
                            <div 
                                key={task.id} 
                                className={`group flex items-center justify-between gap-2 p-3 rounded-xl transition-all ${
                                    task.completed ? "opacity-60 bg-transparent" : "bg-secondary hover:bg-secondary/80"
                                }`}
                            >
                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                    <button 
                                        onClick={() => toggleTask(task.id)}
                                        className="shrink-0 mt-0.5 text-muted-foreground hover:text-emerald-500 transition-colors"
                                    >
                                        {task.completed ? (
                                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                        ) : (
                                            <Circle className="w-5 h-5" />
                                        )}
                                    </button>
                                    <span className={`text-sm truncate w-full transition-all ${task.completed ? "line-through text-muted-foreground" : "text-foreground font-medium"}`}>
                                        {task.title}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    {!task.completed && (
                                        <button
                                            onClick={() => scheduleTask(task)}
                                            className="p-1.5 rounded-lg text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-blue-500/10 hover:text-blue-500 transition-all sm:opacity-100"
                                            title="Agendar no Google Calendar"
                                        >
                                            <Calendar className="w-4 h-4" />
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => deleteTask(task.id)}
                                        className="p-1.5 rounded-lg text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-500 transition-all sm:opacity-100"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
}
