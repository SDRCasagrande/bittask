import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
    title: "BitTasks — Tarefas da Equipe",
    description: "Gerenciador de tarefas da equipe BitKaiser",
    manifest: "/tasks-manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
        title: "BitTasks",
    },
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: "#6366f1",
};

export default function TasksLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-[100dvh] bg-slate-950 text-white flex flex-col overflow-hidden">
            {children}
        </div>
    );
}
