"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Bell, AlertTriangle, CheckSquare, Handshake, X, Clock } from "lucide-react";

interface Alert {
    type: "overdue_task" | "renegotiation" | "assigned_task";
    title: string;
    subtitle: string;
    link: string;
    urgency: "critical" | "warning" | "info";
    id: string;
}

export function NotificationBell() {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [count, setCount] = useState(0);
    const [open, setOpen] = useState(false);
    const [seen, setSeen] = useState<Set<string>>(new Set());
    const ref = useRef<HTMLDivElement>(null);

    const loadAlerts = async () => {
        try {
            const res = await fetch("/api/alerts");
            const data = await res.json();
            if (data.alerts) {
                setAlerts(data.alerts);
                // Count unseen
                const stored = sessionStorage.getItem("bt_seen_alerts");
                const seenSet = stored ? new Set<string>(JSON.parse(stored)) : new Set<string>();
                setSeen(seenSet);
                setCount(data.alerts.filter((a: Alert) => !seenSet.has(a.id)).length);
            }
        } catch { /* */ }
    };

    useEffect(() => {
        loadAlerts();
        const interval = setInterval(loadAlerts, 5 * 60 * 1000); // 5min
        return () => clearInterval(interval);
    }, []);

    // Close on click outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleOpen = () => {
        setOpen(!open);
        if (!open) {
            // Mark all as seen
            const allIds = alerts.map(a => a.id);
            const newSeen = new Set([...seen, ...allIds]);
            setSeen(newSeen);
            setCount(0);
            sessionStorage.setItem("bt_seen_alerts", JSON.stringify([...newSeen]));
        }
    };

    const iconMap = {
        overdue_task: <AlertTriangle className="w-3.5 h-3.5" />,
        renegotiation: <Handshake className="w-3.5 h-3.5" />,
        assigned_task: <CheckSquare className="w-3.5 h-3.5" />,
    };

    const colorMap = {
        critical: "text-red-500 bg-red-500/10",
        warning: "text-amber-500 bg-amber-500/10",
        info: "text-blue-500 bg-blue-500/10",
    };

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={handleOpen}
                className="relative p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                aria-label="Notificações"
            >
                <Bell className="w-4.5 h-4.5" />
                {count > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center animate-pulse-subtle shadow-lg shadow-red-500/30">
                        {count > 9 ? "9+" : count}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-80 max-h-96 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-50 animate-scale-in">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                            <Bell className="w-4 h-4 text-[#00A868]" />
                            Notificações
                        </h3>
                        <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-muted">
                            <X className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                    </div>

                    {/* Alerts list */}
                    <div className="overflow-y-auto max-h-72 divide-y divide-border">
                        {alerts.length === 0 ? (
                            <div className="text-center py-8 text-sm text-muted-foreground">
                                <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                <p>Nenhuma notificação</p>
                            </div>
                        ) : (
                            alerts.map((alert) => (
                                <Link
                                    key={`${alert.type}-${alert.id}`}
                                    href={alert.link}
                                    onClick={() => setOpen(false)}
                                    className="flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
                                >
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${colorMap[alert.urgency]}`}>
                                        {iconMap[alert.type]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-foreground truncate">{alert.title}</p>
                                        <p className="text-[10px] text-muted-foreground mt-0.5">{alert.subtitle}</p>
                                    </div>
                                    {alert.urgency === "critical" && (
                                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 shrink-0">
                                            URGENTE
                                        </span>
                                    )}
                                </Link>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {alerts.length > 0 && (
                        <div className="px-4 py-2.5 border-t border-border bg-muted/10">
                            <p className="text-[10px] text-muted-foreground text-center flex items-center justify-center gap-1">
                                <Clock className="w-3 h-3" /> Atualiza a cada 5 minutos
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
