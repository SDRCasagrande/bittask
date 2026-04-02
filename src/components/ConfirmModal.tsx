"use client";

import { useState, useCallback, createContext, useContext, ReactNode } from "react";
import { AlertTriangle, Trash2, Info, CheckCircle, X } from "lucide-react";

/* ═══ TYPES ═══ */
type ModalVariant = "danger" | "warning" | "info" | "success";

interface ConfirmOptions {
    title: string;
    message: string;
    variant?: ModalVariant;
    confirmText?: string;
    cancelText?: string;
    requireJustification?: boolean;
    justificationLabel?: string;
}

interface ConfirmResult {
    confirmed: boolean;
    justification?: string;
}

interface ConfirmContextType {
    confirm: (options: ConfirmOptions) => Promise<ConfirmResult>;
}

/* ═══ VARIANT CONFIG ═══ */
const VARIANTS: Record<ModalVariant, { icon: typeof AlertTriangle; color: string; bg: string; border: string; btnBg: string; btnHover: string }> = {
    danger: { icon: Trash2, color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20", btnBg: "bg-red-500", btnHover: "hover:bg-red-600" },
    warning: { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20", btnBg: "bg-amber-500", btnHover: "hover:bg-amber-600" },
    info: { icon: Info, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20", btnBg: "bg-blue-500", btnHover: "hover:bg-blue-600" },
    success: { icon: CheckCircle, color: "text-[#00A868]", bg: "bg-[#00A868]/10", border: "border-[#00A868]/20", btnBg: "bg-[#00A868]", btnHover: "hover:bg-[#008f58]" },
};

/* ═══ CONTEXT ═══ */
const ConfirmContext = createContext<ConfirmContextType | null>(null);

export function useConfirm() {
    const ctx = useContext(ConfirmContext);
    if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
    return ctx.confirm;
}

/* ═══ PROVIDER ═══ */
export function ConfirmProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<{
        options: ConfirmOptions;
        resolve: (result: ConfirmResult) => void;
    } | null>(null);
    const [justification, setJustification] = useState("");

    const confirm = useCallback((options: ConfirmOptions): Promise<ConfirmResult> => {
        return new Promise<ConfirmResult>((resolve) => {
            setState({ options, resolve });
            setJustification("");
        });
    }, []);

    function handleConfirm() {
        if (state) {
            state.resolve({ confirmed: true, justification: justification.trim() || undefined });
            setState(null);
            setJustification("");
        }
    }

    function handleCancel() {
        if (state) {
            state.resolve({ confirmed: false });
            setState(null);
            setJustification("");
        }
    }

    const v = state ? VARIANTS[state.options.variant || "danger"] : VARIANTS.danger;
    const Icon = v.icon;
    const needsJustification = state?.options.requireJustification;
    const canConfirm = !needsJustification || justification.trim().length > 0;

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}

            {/* Modal Overlay */}
            {state && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={handleCancel}>
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />
                    <div
                        className="relative w-full max-w-md card-elevated shadow-2xl animate-in zoom-in-95 fade-in duration-200"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header with icon */}
                        <div className="flex items-start gap-4 p-5 pb-0">
                            <div className={`w-12 h-12 rounded-2xl ${v.bg} border ${v.border} flex items-center justify-center shrink-0`}>
                                <Icon className={`w-6 h-6 ${v.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-base font-bold text-foreground">{state.options.title}</h3>
                                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{state.options.message}</p>
                            </div>
                            <button onClick={handleCancel} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground shrink-0 -mt-1 -mr-1">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Justification (optional) */}
                        {needsJustification && (
                            <div className="px-5 pt-4">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                    {state.options.justificationLabel || "Motivo (obrigatório)"}
                                </label>
                                <textarea
                                    value={justification}
                                    onChange={e => setJustification(e.target.value)}
                                    autoFocus
                                    rows={2}
                                    placeholder="Descreva o motivo..."
                                    className="w-full mt-1.5 px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-[#00A868]/50 resize-none"
                                />
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-2 p-5">
                            <button
                                onClick={handleCancel}
                                className="px-4 py-2 rounded-xl text-sm font-medium bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                            >
                                {state.options.cancelText || "Cancelar"}
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={!canConfirm}
                                className={`px-4 py-2 rounded-xl text-sm font-bold text-white shadow-lg transition-all ${v.btnBg} ${v.btnHover} ${!canConfirm ? "opacity-40 cursor-not-allowed" : "active:scale-95"}`}
                            >
                                {state.options.confirmText || "Confirmar"}
                            </button>
                        </div>

                        {/* BitTask branding */}
                        <div className="absolute -top-px left-0 right-0 h-1 rounded-t-2xl overflow-hidden">
                            <div className={`h-full ${v.btnBg}`} />
                        </div>
                    </div>
                </div>
            )}
        </ConfirmContext.Provider>
    );
}
