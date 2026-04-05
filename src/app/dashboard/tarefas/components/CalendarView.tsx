"use client";

import { useState, useMemo, useCallback } from "react";
import { ChevronLeft, ChevronRight, Plus, CalendarDays } from "lucide-react";
import { TaskData, today, formatDateISO } from "./types";

interface GCalEvent {
    id: string; title: string; date: string; time: string;
    isGoogleEvent: boolean; isBitTask: boolean; htmlLink: string;
}

interface CalendarViewProps {
    allTasks: TaskData[];
    gcalEvents: GCalEvent[];
    gcalConnected: boolean | null;
    onOpenAddTask: (listId?: string, date?: string, time?: string) => void;
    onOpenDetail: (task: TaskData) => void;
}

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6);

function TaskPill({ task, onOpenDetail, size = "normal" }: { task: TaskData; onOpenDetail: (t: TaskData) => void; size?: "normal" | "small" }) {
    const isSmall = size === "small";
    const cls = task.priority === "high" ? "bg-red-500/15 text-red-500"
        : task.priority === "medium" ? "bg-amber-500/15 text-amber-500"
        : "bg-[#00A868]/15 text-[#00A868]";
    return (
        <button onClick={(e) => { e.stopPropagation(); onOpenDetail(task); }}
            className={`px-${isSmall ? 1 : 2} py-0.5 rounded text-[${isSmall ? "8px" : "10px"}] lg:text-[${isSmall ? "9px" : "10px"}] font-medium truncate max-w-[200px] ${cls} hover:opacity-80 transition-opacity`}>
            {!isSmall && task.time && <span className="opacity-60 mr-0.5">{task.time} </span>}{task.title}
        </button>
    );
}

function GCalPill({ ev, size = "normal" }: { ev: GCalEvent; size?: "normal" | "small" }) {
    const isSmall = size === "small";
    return (
        <button onClick={(e) => { e.stopPropagation(); if (ev.htmlLink) window.open(ev.htmlLink, "_blank"); }}
            className={`px-${isSmall ? 1 : 2} py-0.5 rounded text-[${isSmall ? "8px" : "10px"}] lg:text-[${isSmall ? "9px" : "10px"}] font-medium truncate max-w-[200px] bg-[#4285F4]/15 text-[#4285F4] hover:opacity-80 transition-opacity`}>
            {!isSmall && ev.time && <span className="opacity-60 mr-0.5">{ev.time} </span>}{ev.title}
        </button>
    );
}

export function CalendarView({ allTasks, gcalEvents, gcalConnected, onOpenAddTask, onOpenDetail }: CalendarViewProps) {
    const [calView, setCalView] = useState<"day" | "week" | "month">("week");
    const [calDate, setCalDate] = useState(new Date());
    const [calMonth, setCalMonth] = useState(new Date().getMonth());
    const [calYear, setCalYear] = useState(new Date().getFullYear());

    const calDateStr = formatDateISO(calDate);

    const getTasksForDate = useCallback((dateStr: string) => allTasks.filter(t => t.date === dateStr && !t.completed), [allTasks]);
    const getEventsForDate = useCallback((dateStr: string) => gcalEvents.filter(e => e.date === dateStr && !e.isBitTask), [gcalEvents]);

    // Month grid
    const calDays = useMemo(() => {
        const lastDay = new Date(calYear, calMonth + 1, 0).getDate();
        const startDow = new Date(calYear, calMonth, 1).getDay();
        const days: { day: number; date: string; tasks: TaskData[]; gcalEvents: GCalEvent[] }[] = [];
        for (let i = 0; i < startDow; i++) days.push({ day: 0, date: "", tasks: [], gcalEvents: [] });
        for (let d = 1; d <= lastDay; d++) {
            const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            days.push({ day: d, date: dateStr, tasks: allTasks.filter(t => t.date === dateStr && !t.completed), gcalEvents: gcalEvents.filter(e => e.date === dateStr && !e.isBitTask) });
        }
        return days;
    }, [calMonth, calYear, allTasks, gcalEvents]);

    // Week days
    const getWeekDays = useMemo(() => {
        const d = new Date(calDate);
        const dayOfWeek = d.getDay();
        const start = new Date(d); start.setDate(d.getDate() - dayOfWeek);
        return Array.from({ length: 7 }, (_, i) => {
            const dd = new Date(start); dd.setDate(start.getDate() + i);
            return { date: formatDateISO(dd), day: dd.getDate(), dow: dd.getDay(), label: dd.toLocaleDateString("pt-BR", { weekday: "short" }), full: dd };
        });
    }, [calDate]);

    const monthLabel = new Date(calYear, calMonth).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

    const navigateCal = (dir: number) => {
        if (calView === "month") {
            if (dir > 0) { if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); } else setCalMonth(calMonth + 1); }
            else { if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); } else setCalMonth(calMonth - 1); }
        } else if (calView === "week") {
            const d = new Date(calDate); d.setDate(d.getDate() + dir * 7); setCalDate(d);
        } else {
            const d = new Date(calDate); d.setDate(d.getDate() + dir); setCalDate(d);
        }
    };

    const calTitle = calView === "month" ? monthLabel
        : calView === "week" ? `${getWeekDays[0].full.toLocaleDateString("pt-BR", { day: "numeric", month: "short" })} — ${getWeekDays[6].full.toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" })}`
        : calDate.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

    const goToday = () => { const now = new Date(); setCalDate(now); setCalMonth(now.getMonth()); setCalYear(now.getFullYear()); };

    // Drag & Drop for rescheduling tasks within calendar
    const [dragTaskId, setDragTaskId] = useState<string | null>(null);

    function handleDragStart(e: React.DragEvent, taskId: string) {
        setDragTaskId(taskId);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", taskId);
    }

    function handleDrop(e: React.DragEvent, date: string, time?: string) {
        e.preventDefault();
        const taskId = e.dataTransfer.getData("text/plain") || dragTaskId;
        if (!taskId) return;
        setDragTaskId(null);
        // Update task via API
        fetch(`/api/tasks/item/${taskId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ date, ...(time ? { time } : {}) }),
        }).catch(() => {});
    }

    function handleDragOver(e: React.DragEvent) {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    }

    const todayStr = today();

    return (
        <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 flex flex-col rounded-2xl overflow-hidden border border-border card-elevated">
                {/* Toolbar */}
                <div className="flex items-center justify-between px-3 lg:px-4 py-2 border-b border-border bg-card shrink-0 gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 lg:gap-3">
                        <button onClick={() => navigateCal(-1)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors touch-target"><ChevronLeft className="w-4 h-4" /></button>
                        <h3 className="text-xs lg:text-sm font-bold text-foreground capitalize min-w-0 text-center truncate">{calTitle}</h3>
                        <button onClick={() => navigateCal(1)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors touch-target"><ChevronRight className="w-4 h-4" /></button>
                        <button onClick={goToday} className="px-2 py-1.5 rounded-lg text-[10px] lg:text-[11px] font-medium text-muted-foreground hover:bg-muted transition-colors">Hoje</button>
                    </div>
                    <div className="flex items-center gap-1">
                        {(["day", "week", "month"] as const).map(v => (
                            <button key={v} onClick={() => setCalView(v)}
                                className={`px-2 lg:px-2.5 py-1.5 rounded-lg text-[10px] lg:text-[11px] font-medium transition-all ${calView === v ? "bg-[#00A868]/10 text-[#00A868] font-bold" : "text-muted-foreground hover:bg-muted"}`}>
                                {v === "day" ? "Dia" : v === "week" ? "Semana" : "Mês"}
                            </button>
                        ))}
                        <div className="w-px h-4 bg-border mx-1" />
                        <button onClick={() => onOpenAddTask()}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] lg:text-[11px] font-bold bg-[#00A868] text-white hover:bg-[#008f58] shadow-sm transition-all active:scale-95">
                            <Plus className="w-3 h-3" /> <span className="hidden sm:inline">Nova Tarefa</span>
                        </button>
                        {gcalConnected && <span className="w-1.5 h-1.5 rounded-full bg-[#4285F4] animate-pulse" />}
                        {gcalConnected === false && (
                            <button onClick={() => { window.location.href = "/api/google-calendar/auth"; }}
                                className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium text-[#4285F4] bg-[#4285F4]/10 hover:bg-[#4285F4]/20 transition-colors">
                                <CalendarDays className="w-3 h-3" /> <span className="hidden sm:inline">Google</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* DAY VIEW */}
                {calView === "day" && (
                    <div className="flex-1 overflow-y-auto">
                        <div className="relative">
                            {HOURS.map(h => {
                                const tasksAtH = getTasksForDate(calDateStr).filter(t => t.time && parseInt(t.time.split(":")[0]) === h);
                                const eventsAtH = getEventsForDate(calDateStr).filter(e => e.time && parseInt(e.time.split(":")[0]) === h);
                                return (
                                    <div key={h} className="flex border-b border-border min-h-[60px] group">
                                        <div className="w-14 lg:w-16 shrink-0 text-[10px] text-muted-foreground font-medium pt-1 text-right pr-2 border-r border-border">{String(h).padStart(2, "0")}:00</div>
                                        <div className="flex-1 relative">
                                            <div onClick={() => onOpenAddTask(undefined, calDateStr, `${String(h).padStart(2, "0")}:00`)}
                                                onDragOver={handleDragOver}
                                                onDrop={(e) => handleDrop(e, calDateStr, `${String(h).padStart(2, "0")}:00`)}
                                                className={`h-[30px] border-b border-border/30 hover:bg-[#00A868]/5 cursor-pointer transition-colors flex items-center gap-1 px-2 ${dragTaskId ? "bg-[#00A868]/3" : ""}`}>
                                                {tasksAtH.filter(t => parseInt(t.time!.split(":")[1]) < 30).map(t => (
                                                    <div key={t.id} draggable onDragStart={(e) => handleDragStart(e, t.id)}>
                                                        <TaskPill task={t} onOpenDetail={onOpenDetail} />
                                                    </div>
                                                ))}
                                                {eventsAtH.filter(e => parseInt(e.time!.split(":")[1]) < 30).map(ev => (
                                                    <GCalPill key={ev.id} ev={ev} />
                                                ))}
                                            </div>
                                            <div onClick={() => onOpenAddTask(undefined, calDateStr, `${String(h).padStart(2, "0")}:30`)}
                                                onDragOver={handleDragOver}
                                                onDrop={(e) => handleDrop(e, calDateStr, `${String(h).padStart(2, "0")}:30`)}
                                                className={`h-[30px] hover:bg-[#00A868]/5 cursor-pointer transition-colors flex items-center gap-1 px-2 ${dragTaskId ? "bg-[#00A868]/3" : ""}`}>
                                                {tasksAtH.filter(t => parseInt(t.time!.split(":")[1]) >= 30).map(t => (
                                                    <div key={t.id} draggable onDragStart={(e) => handleDragStart(e, t.id)}>
                                                        <TaskPill task={t} onOpenDetail={onOpenDetail} />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* WEEK VIEW */}
                {calView === "week" && (
                    <div className="flex-1 overflow-y-auto overflow-x-auto">
                        <div className="flex sticky top-0 z-10 bg-card border-b border-border">
                            <div className="w-14 lg:w-16 shrink-0 border-r border-border" />
                            {getWeekDays.map(wd => {
                                const isToday = wd.date === todayStr;
                                return (
                                    <div key={wd.date} className={`flex-1 min-w-[80px] lg:min-w-[100px] text-center py-2 border-r border-border ${isToday ? "bg-[#00A868]/5" : ""}`}>
                                        <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{wd.label}</div>
                                        <button onClick={() => { setCalDate(wd.full); setCalView("day"); }}
                                            className={`text-sm font-bold mt-0.5 w-7 h-7 rounded-full flex items-center justify-center mx-auto transition-colors ${isToday ? "bg-[#00A868] text-white" : "text-foreground hover:bg-muted"}`}>
                                            {wd.day}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                        {HOURS.map(h => (
                            <div key={h} className="flex border-b border-border">
                                <div className="w-14 lg:w-16 shrink-0 text-[10px] text-muted-foreground font-medium pt-1 text-right pr-2 border-r border-border">{String(h).padStart(2, "0")}:00</div>
                                {getWeekDays.map(wd => {
                                    const isToday = wd.date === todayStr;
                                    const tasksAtH = getTasksForDate(wd.date).filter(t => t.time && parseInt(t.time.split(":")[0]) === h);
                                    const eventsAtH = getEventsForDate(wd.date).filter(e => e.time && parseInt(e.time.split(":")[0]) === h);
                                    return (
                                        <div key={wd.date} className={`flex-1 min-w-[80px] lg:min-w-[100px] border-r border-border ${isToday ? "bg-[#00A868]/3" : ""}`}>
                                            <div onClick={() => onOpenAddTask(undefined, wd.date, `${String(h).padStart(2, "0")}:00`)}
                                                onDragOver={handleDragOver}
                                                onDrop={(e) => handleDrop(e, wd.date, `${String(h).padStart(2, "0")}:00`)}
                                                className={`h-[28px] border-b border-border/20 hover:bg-[#00A868]/5 cursor-pointer transition-colors px-0.5 flex items-center gap-0.5 overflow-hidden ${dragTaskId ? "bg-[#00A868]/3" : ""}`}>
                                                {tasksAtH.filter(t => parseInt(t.time!.split(":")[1]) < 30).map(t => (
                                                    <div key={t.id} draggable onDragStart={(e) => handleDragStart(e, t.id)}>
                                                        <TaskPill task={t} onOpenDetail={onOpenDetail} size="small" />
                                                    </div>
                                                ))}
                                                {eventsAtH.filter(e => parseInt(e.time!.split(":")[1]) < 30).map(ev => (
                                                    <GCalPill key={ev.id} ev={ev} size="small" />
                                                ))}
                                            </div>
                                            <div onClick={() => onOpenAddTask(undefined, wd.date, `${String(h).padStart(2, "0")}:30`)}
                                                onDragOver={handleDragOver}
                                                onDrop={(e) => handleDrop(e, wd.date, `${String(h).padStart(2, "0")}:30`)}
                                                className={`h-[28px] hover:bg-[#00A868]/5 cursor-pointer transition-colors px-0.5 flex items-center gap-0.5 overflow-hidden ${dragTaskId ? "bg-[#00A868]/3" : ""}`}>
                                                {tasksAtH.filter(t => parseInt(t.time!.split(":")[1]) >= 30).map(t => (
                                                    <div key={t.id} draggable onDragStart={(e) => handleDragStart(e, t.id)}>
                                                        <TaskPill task={t} onOpenDetail={onOpenDetail} size="small" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                )}

                {/* MONTH VIEW */}
                {calView === "month" && (
                    <div className="flex-1 overflow-y-auto">
                        <div className="grid grid-cols-7 border-b border-border bg-muted/30">
                            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(d => (
                                <div key={d} className="px-2 py-1.5 text-[9px] lg:text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-center">{d}</div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 flex-1">
                            {calDays.map((cell, idx) => {
                                const isToday = cell.date === todayStr;
                                return (
                                    <div key={idx}
                                        onClick={() => { if (cell.day > 0) { setCalDate(new Date(cell.date + "T12:00:00")); setCalView("day"); } }}
                                        onDragOver={cell.day > 0 ? handleDragOver : undefined}
                                        onDrop={cell.day > 0 ? (e) => handleDrop(e, cell.date) : undefined}
                                        className={`min-h-[80px] lg:min-h-[110px] border-b border-r border-border p-1 transition-colors cursor-pointer group
                                            ${cell.day === 0 ? "bg-muted/20 cursor-default" : "hover:bg-[#00A868]/5"}
                                            ${isToday ? "bg-[#00A868]/5" : ""}
                                            ${dragTaskId && cell.day > 0 ? "bg-[#00A868]/3" : ""}`}>
                                        {cell.day > 0 && (<>
                                            <div className="flex items-center justify-between mb-0.5">
                                                <span className={`text-[10px] lg:text-xs font-bold w-5 h-5 lg:w-6 lg:h-6 rounded-full flex items-center justify-center ${isToday ? "bg-[#00A868] text-white" : "text-foreground"}`}>{cell.day}</span>
                                                <button onClick={(e) => { e.stopPropagation(); onOpenAddTask(undefined, cell.date); }} className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-muted"><Plus className="w-3 h-3 text-[#00A868]" /></button>
                                            </div>
                                            <div className="space-y-0.5">
                                                {cell.tasks.slice(0, 3).map(t => (
                                                    <div key={t.id} draggable onDragStart={(e) => handleDragStart(e, t.id)}>
                                                        <button onClick={(e) => { e.stopPropagation(); onOpenDetail(t); }}
                                                            className={`w-full text-left px-1 py-0 rounded text-[9px] lg:text-[10px] font-medium truncate transition-colors hover:opacity-80
                                                                ${t.priority === "high" ? "bg-red-500/15 text-red-500" : t.priority === "medium" ? "bg-amber-500/15 text-amber-500" : "bg-[#00A868]/15 text-[#00A868]"}`}>
                                                            {t.time && <span className="opacity-60 mr-0.5">{t.time}</span>}{t.title}
                                                        </button>
                                                    </div>
                                                ))}
                                                {cell.gcalEvents.slice(0, 2).map(ev => (
                                                    <button key={ev.id} onClick={(e) => { e.stopPropagation(); if (ev.htmlLink) window.open(ev.htmlLink, "_blank"); }}
                                                        className="w-full text-left px-1 rounded text-[9px] lg:text-[10px] font-medium truncate bg-[#4285F4]/15 text-[#4285F4] hover:opacity-80">
                                                        {ev.time && <span className="opacity-60 mr-0.5">{ev.time}</span>}{ev.title}
                                                    </button>
                                                ))}
                                                {(cell.tasks.length + cell.gcalEvents.length) > 4 && (
                                                    <span className="text-[8px] text-muted-foreground font-medium px-1">+{(cell.tasks.length + cell.gcalEvents.length) - 4}</span>
                                                )}
                                            </div>
                                        </>)}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Legend */}
                <div className="flex items-center gap-3 px-3 py-1.5 border-t border-border bg-muted/20 text-[9px] lg:text-[10px] text-muted-foreground shrink-0">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#00A868]/40" /> BitTask</span>
                    {gcalConnected && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#4285F4]/40" /> Google</span>}
                    <span className="ml-auto">Clique para criar · Arraste para mover</span>
                </div>
            </div>
        </div>
    );
}
