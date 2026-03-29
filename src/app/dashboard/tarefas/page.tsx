"use client";

import { useState, useEffect, useMemo } from "react";
import {
    CheckSquare, Plus, Trash2, Circle, CheckCircle2, Calendar,
    Star, ChevronLeft, ChevronRight, Clock, ListTodo, CalendarDays,
    ExternalLink
} from "lucide-react";

interface Task {
    id: string;
    title: string;
    completed: boolean;
    date: string; // YYYY-MM-DD
    time: string; // HH:mm or ""
    starred: boolean;
    list: string;
    scheduled: boolean; // sent to Google Calendar
    createdAt: number;
}

const STORAGE_KEY = "bitkaiser_tasks_v2";
const LISTS_KEY = "bitkaiser_task_lists";

function today() { return new Date().toISOString().split("T")[0]; }
function fmtDate(d: string) {
    if (!d) return "";
    const [y, m, day] = d.split("-");
    return `${day}/${m}`;
}
function dayName(d: string) {
    const dt = new Date(d + "T12:00:00");
    return dt.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
}
function isToday(d: string) { return d === today(); }
function isTomorrow(d: string) {
    const t = new Date(); t.setDate(t.getDate() + 1);
    return d === t.toISOString().split("T")[0];
}
function friendlyDate(d: string) {
    if (!d) return "Sem data";
    if (isToday(d)) return "Hoje";
    if (isTomorrow(d)) return "Amanhã";
    const dt = new Date(d + "T12:00:00");
    return dt.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" });
}

export default function TarefasPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [lists, setLists] = useState<string[]>(["Minhas Tarefas"]);
    const [activeList, setActiveList] = useState("Minhas Tarefas");
    const [newTask, setNewTask] = useState("");
    const [newDate, setNewDate] = useState(today());
    const [newTime, setNewTime] = useState("");
    const [showNewList, setShowNewList] = useState(false);
    const [newListName, setNewListName] = useState("");
    const [view, setView] = useState<"list" | "calendar">("list");
    const [calMonth, setCalMonth] = useState(new Date().getMonth());
    const [calYear, setCalYear] = useState(new Date().getFullYear());
    const [showCompleted, setShowCompleted] = useState(false);

    useEffect(() => {
        try {
            const s = localStorage.getItem(STORAGE_KEY);
            if (s) setTasks(JSON.parse(s));
            const l = localStorage.getItem(LISTS_KEY);
            if (l) setLists(JSON.parse(l));
        } catch { /* */ }
    }, []);

    useEffect(() => {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); } catch { /* */ }
    }, [tasks]);

    useEffect(() => {
        try { localStorage.setItem(LISTS_KEY, JSON.stringify(lists)); } catch { /* */ }
    }, [lists]);

    const addTask = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!newTask.trim()) return;
        setTasks([...tasks, {
            id: crypto.randomUUID(), title: newTask.trim(), completed: false,
            date: newDate, time: newTime, starred: false, list: activeList,
            scheduled: false, createdAt: Date.now(),
        }]);
        setNewTask(""); setNewTime("");
    };

    const toggleTask = (id: string) => setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    const toggleStar = (id: string) => setTasks(tasks.map(t => t.id === id ? { ...t, starred: !t.starred } : t));
    const deleteTask = (id: string) => setTasks(tasks.filter(t => t.id !== id));

    const scheduleToCalendar = (task: Task) => {
        const title = encodeURIComponent(task.title);
        let dateStr = task.date.replace(/-/g, "");
        let url = `https://calendar.google.com/calendar/r/eventedit?text=${title}&details=${encodeURIComponent("Tarefa do BitKaiser")}`;
        if (task.date) {
            if (task.time) {
                const timeStr = task.time.replace(":", "") + "00";
                url += `&dates=${dateStr}T${timeStr}/${dateStr}T${timeStr}`;
            } else {
                url += `&dates=${dateStr}/${dateStr}`;
            }
        }
        window.open(url, "_blank");
        setTasks(tasks.map(t => t.id === task.id ? { ...t, scheduled: true } : t));
    };

    const addList = () => {
        if (!newListName.trim() || lists.includes(newListName.trim())) return;
        setLists([...lists, newListName.trim()]);
        setActiveList(newListName.trim());
        setNewListName(""); setShowNewList(false);
    };

    const deleteList = (name: string) => {
        if (lists.length <= 1) return;
        setLists(lists.filter(l => l !== name));
        setTasks(tasks.filter(t => t.list !== name));
        if (activeList === name) setActiveList(lists.find(l => l !== name) || lists[0]);
    };

    const filteredTasks = useMemo(() =>
        tasks.filter(t => t.list === activeList).sort((a, b) => {
            if (a.completed !== b.completed) return Number(a.completed) - Number(b.completed);
            if (a.starred !== b.starred) return Number(b.starred) - Number(a.starred);
            if (a.date !== b.date) return a.date.localeCompare(b.date);
            return a.createdAt - b.createdAt;
        })
    , [tasks, activeList]);

    const pendingTasks = filteredTasks.filter(t => !t.completed);
    const completedTasks = filteredTasks.filter(t => t.completed);

    // Group pending by date
    const groupedByDate = useMemo(() => {
        const groups: Record<string, Task[]> = {};
        pendingTasks.forEach(t => {
            const key = t.date || "no-date";
            if (!groups[key]) groups[key] = [];
            groups[key].push(t);
        });
        return Object.entries(groups).sort(([a], [b]) => {
            if (a === "no-date") return 1;
            if (b === "no-date") return -1;
            return a.localeCompare(b);
        });
    }, [pendingTasks]);

    // Calendar data
    const calDays = useMemo(() => {
        const first = new Date(calYear, calMonth, 1);
        const lastDay = new Date(calYear, calMonth + 1, 0).getDate();
        const startDow = first.getDay();
        const days: { day: number; date: string; tasks: Task[] }[] = [];
        for (let i = 0; i < startDow; i++) days.push({ day: 0, date: "", tasks: [] });
        for (let d = 1; d <= lastDay; d++) {
            const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            days.push({ day: d, date: dateStr, tasks: tasks.filter(t => t.date === dateStr && !t.completed) });
        }
        return days;
    }, [calMonth, calYear, tasks]);

    const monthLabel = new Date(calYear, calMonth).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

    const totalPending = tasks.filter(t => !t.completed).length;
    const totalToday = tasks.filter(t => t.date === today() && !t.completed).length;

    return (
        <div className="max-w-6xl mx-auto space-y-5">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white">
                        <CheckSquare className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-foreground">Tarefas</h1>
                        <p className="text-xs text-muted-foreground">{totalPending} pendentes · {totalToday} para hoje</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setView("list")} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${view === "list" ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" : "text-muted-foreground hover:bg-muted"}`}>
                        <ListTodo className="w-4 h-4" /> Lista
                    </button>
                    <button onClick={() => setView("calendar")} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${view === "calendar" ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" : "text-muted-foreground hover:bg-muted"}`}>
                        <CalendarDays className="w-4 h-4" /> Calendário
                    </button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-5">
                {/* Sidebar — Lists */}
                <div className="lg:w-56 shrink-0 space-y-2">
                    <div className="bg-card border border-border rounded-2xl p-3 space-y-1">
                        {lists.map(l => (
                            <button key={l} onClick={() => setActiveList(l)}
                                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                                    activeList === l ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                }`}>
                                <span className="flex items-center gap-2 truncate">
                                    <CheckSquare className="w-4 h-4 shrink-0" /> {l}
                                </span>
                                <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full">
                                    {tasks.filter(t => t.list === l && !t.completed).length}
                                </span>
                            </button>
                        ))}
                    </div>
                    {showNewList ? (
                        <div className="flex gap-1.5">
                            <input value={newListName} onChange={e => setNewListName(e.target.value)} onKeyDown={e => e.key === "Enter" && addList()}
                                placeholder="Nome da lista" autoFocus
                                className="flex-1 px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-blue-500/50" />
                            <button onClick={addList} className="px-3 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium">OK</button>
                        </div>
                    ) : (
                        <button onClick={() => setShowNewList(true)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted transition-all">
                            <Plus className="w-4 h-4" /> Nova lista
                        </button>
                    )}
                </div>

                {/* Main Content */}
                <div className="flex-1 space-y-4">
                    {/* Add Task */}
                    <form onSubmit={addTask} className="bg-card border border-border rounded-2xl p-4">
                        <div className="flex flex-col sm:flex-row gap-2">
                            <input type="text" value={newTask} onChange={e => setNewTask(e.target.value)} placeholder="Adicionar nova tarefa..."
                                className="flex-1 px-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-blue-500/50" />
                            <div className="flex gap-2">
                                <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
                                    className="px-3 py-2.5 bg-muted/50 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-blue-500/50" />
                                <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)}
                                    className="px-3 py-2.5 bg-muted/50 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-blue-500/50 w-28" />
                                <button type="submit" disabled={!newTask.trim()}
                                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium text-sm transition-colors disabled:opacity-50 flex items-center gap-1.5 shrink-0">
                                    <Plus className="w-4 h-4" /> Criar
                                </button>
                            </div>
                        </div>
                    </form>

                    {view === "list" ? (
                        /* ═══ LIST VIEW ═══ */
                        <div className="space-y-4">
                            {groupedByDate.length === 0 && completedTasks.length === 0 && (
                                <div className="text-center py-16 text-muted-foreground">
                                    <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                    <p className="text-sm">Nenhuma tarefa em "{activeList}"</p>
                                </div>
                            )}

                            {groupedByDate.map(([date, dateTasks]) => (
                                <div key={date}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`text-xs font-bold uppercase tracking-wide ${
                                            isToday(date) ? "text-blue-500" : isTomorrow(date) ? "text-amber-500" : "text-muted-foreground"
                                        }`}>
                                            {friendlyDate(date)}
                                        </span>
                                        {date !== "no-date" && <span className="text-[10px] text-muted-foreground/50">{dayName(date)} {fmtDate(date)}</span>}
                                        <div className="flex-1 h-px bg-border" />
                                    </div>
                                    <div className="space-y-1">
                                        {dateTasks.map(task => (
                                            <TaskRow key={task.id} task={task} onToggle={toggleTask} onStar={toggleStar} onDelete={deleteTask} onSchedule={scheduleToCalendar} />
                                        ))}
                                    </div>
                                </div>
                            ))}

                            {/* Completed */}
                            {completedTasks.length > 0 && (
                                <div>
                                    <button onClick={() => setShowCompleted(!showCompleted)} className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors mb-2">
                                        {showCompleted ? "▾" : "▸"} Concluídas ({completedTasks.length})
                                    </button>
                                    {showCompleted && (
                                        <div className="space-y-1 opacity-60">
                                            {completedTasks.map(task => (
                                                <TaskRow key={task.id} task={task} onToggle={toggleTask} onStar={toggleStar} onDelete={deleteTask} onSchedule={scheduleToCalendar} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        /* ═══ CALENDAR VIEW ═══ */
                        <div className="bg-card border border-border rounded-2xl overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                                <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); } else setCalMonth(calMonth - 1); }}
                                    className="p-1.5 rounded-lg hover:bg-muted transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                                <span className="text-sm font-bold text-foreground capitalize">{monthLabel}</span>
                                <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); } else setCalMonth(calMonth + 1); }}
                                    className="p-1.5 rounded-lg hover:bg-muted transition-colors"><ChevronRight className="w-4 h-4" /></button>
                            </div>
                            <div className="grid grid-cols-7 text-center text-[10px] font-bold uppercase text-muted-foreground border-b border-border">
                                {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(d => <div key={d} className="py-2">{d}</div>)}
                            </div>
                            <div className="grid grid-cols-7">
                                {calDays.map((cell, i) => (
                                    <div key={i} className={`min-h-[72px] border-b border-r border-border p-1 ${
                                        cell.day === 0 ? "bg-muted/20" : isToday(cell.date) ? "bg-blue-500/5" : ""
                                    }`}>
                                        {cell.day > 0 && (
                                            <>
                                                <span className={`text-xs font-bold ${isToday(cell.date) ? "text-blue-500" : "text-foreground"}`}>{cell.day}</span>
                                                <div className="space-y-0.5 mt-0.5">
                                                    {cell.tasks.slice(0, 3).map(t => (
                                                        <div key={t.id} className={`text-[9px] truncate px-1 py-0.5 rounded ${
                                                            t.starred ? "bg-amber-500/20 text-amber-600 dark:text-amber-400" : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                                        }`}>{t.time && <span className="font-bold">{t.time} </span>}{t.title}</div>
                                                    ))}
                                                    {cell.tasks.length > 3 && <span className="text-[9px] text-muted-foreground">+{cell.tasks.length - 3}</span>}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ─── Task Row Component ─── */
function TaskRow({ task, onToggle, onStar, onDelete, onSchedule }: {
    task: Task;
    onToggle: (id: string) => void;
    onStar: (id: string) => void;
    onDelete: (id: string) => void;
    onSchedule: (t: Task) => void;
}) {
    return (
        <div className={`group flex items-center gap-2 p-3 rounded-xl transition-all ${
            task.completed ? "bg-transparent" : "bg-card border border-border hover:shadow-sm"
        }`}>
            <button onClick={() => onToggle(task.id)} className="shrink-0 text-muted-foreground hover:text-blue-500 transition-colors">
                {task.completed ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5" />}
            </button>
            <div className="flex-1 min-w-0">
                <span className={`text-sm block truncate transition-all ${task.completed ? "line-through text-muted-foreground" : "text-foreground font-medium"}`}>
                    {task.title}
                </span>
                {(task.time || task.scheduled) && !task.completed && (
                    <div className="flex items-center gap-2 mt-0.5">
                        {task.time && <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Clock className="w-3 h-3" /> {task.time}</span>}
                        {task.scheduled && <span className="text-[10px] text-emerald-500 flex items-center gap-0.5"><Calendar className="w-3 h-3" /> Agendado</span>}
                    </div>
                )}
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
                <button onClick={() => onStar(task.id)} className={`p-1.5 rounded-lg transition-all ${task.starred ? "text-amber-500" : "text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-amber-500"} sm:opacity-100`}>
                    <Star className={`w-4 h-4 ${task.starred ? "fill-amber-500" : ""}`} />
                </button>
                {!task.completed && (
                    <button onClick={() => onSchedule(task)} className={`p-1.5 rounded-lg transition-all ${task.scheduled ? "text-emerald-500" : "text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-blue-500"} sm:opacity-100`} title="Agendar no Google Calendar">
                        <ExternalLink className="w-4 h-4" />
                    </button>
                )}
                <button onClick={() => onDelete(task.id)} className="p-1.5 rounded-lg text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-500/10 transition-all sm:opacity-100">
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
