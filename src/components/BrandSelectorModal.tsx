"use client";

import { useState } from "react";
import { X, Check, CreditCard } from "lucide-react";
import { BrandIcon } from "./BrandIcons";

interface BrandSelectorProps {
    brands: string[];
    enabledBrands: Record<string, boolean>;
    activeBrand: string;
    onToggle: (brand: string, enabled: boolean) => void;
    onSelect: (brand: string) => void;
    onClose: () => void;
}

export function BrandSelectorModal({ brands, enabledBrands, activeBrand, onToggle, onSelect, onClose }: BrandSelectorProps) {
    const [local, setLocal] = useState<Record<string, boolean>>({ ...enabledBrands });

    function toggle(b: string) {
        setLocal(prev => ({ ...prev, [b]: !prev[b] }));
    }

    function handleDone() {
        // Apply all changes
        for (const b of brands) {
            if (local[b] !== enabledBrands[b]) {
                onToggle(b, !!local[b]);
            }
        }
        // Select first enabled if current is disabled
        if (!local[activeBrand]) {
            const first = brands.find(b => local[b]);
            if (first) onSelect(first);
        }
        onClose();
    }

    const enabledCount = brands.filter(b => local[b]).length;

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div
                className="relative w-full sm:max-w-md bg-card border border-border rounded-t-3xl sm:rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 fade-in duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Top accent */}
                <div className="absolute -top-px left-0 right-0 h-1 rounded-t-3xl sm:rounded-t-2xl overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#00A868] via-[#00A868] to-emerald-400" />
                </div>

                {/* Drag handle (mobile) */}
                <div className="sm:hidden flex justify-center pt-3">
                    <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-4 pb-2">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-[#00A868]/10 border border-[#00A868]/20 flex items-center justify-center">
                            <CreditCard className="w-4.5 h-4.5 text-[#00A868]" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-foreground">Bandeiras</h3>
                            <p className="text-[10px] text-muted-foreground">{enabledCount} de {brands.length} ativas</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Brand Grid */}
                <div className="grid grid-cols-2 gap-2 px-5 py-4">
                    {brands.map(b => {
                        const isEnabled = !!local[b];
                        const isActive = activeBrand === b && isEnabled;
                        return (
                            <button
                                key={b}
                                type="button"
                                onClick={() => {
                                    if (isEnabled) {
                                        // If it's the active brand, just select
                                        if (!isActive) {
                                            onSelect(b);
                                        } else {
                                            toggle(b);
                                        }
                                    } else {
                                        toggle(b);
                                    }
                                }}
                                className={`relative flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                                    isActive
                                        ? "bg-[#00A868]/10 border-[#00A868] shadow-sm shadow-[#00A868]/10"
                                        : isEnabled
                                            ? "bg-card border-border hover:border-[#00A868]/40"
                                            : "bg-muted/20 border-transparent opacity-40 hover:opacity-70"
                                }`}
                            >
                                <BrandIcon brand={b} size={22} />
                                <span className={`text-xs font-bold ${isEnabled ? "text-foreground" : "text-muted-foreground line-through"}`}>
                                    {b}
                                </span>
                                {/* Check indicator */}
                                {isEnabled && (
                                    <div className={`absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center ${
                                        isActive ? "bg-[#00A868]" : "bg-[#00A868]/30"
                                    }`}>
                                        <Check className="w-2.5 h-2.5 text-white" />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-5 pb-5 pt-1">
                    <button
                        onClick={() => {
                            const allEnabled = brands.every(b => local[b]);
                            const newState: Record<string, boolean> = {};
                            brands.forEach(b => newState[b] = !allEnabled);
                            // Always keep at least VISA/MASTER
                            if (!allEnabled === false) newState[brands[0]] = true;
                            setLocal(newState);
                        }}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                        {brands.every(b => local[b]) ? "Desmarcar todas" : "Marcar todas"}
                    </button>
                    <button
                        onClick={handleDone}
                        className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-bold bg-[#00A868] text-white shadow-lg shadow-[#00A868]/20 hover:bg-[#008f58] active:scale-95 transition-all"
                    >
                        <Check className="w-4 h-4" /> Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * BrandStrip — compact inline brand display with trigger to open modal
 */
export function BrandStrip({ brands, enabledBrands, activeBrand, onBrandClick, onOpenModal }: {
    brands: string[];
    enabledBrands: Record<string, boolean>;
    activeBrand: string;
    onBrandClick: (b: string) => void;
    onOpenModal: () => void;
}) {
    return (
        <div className="flex gap-1.5 flex-wrap items-center">
            {brands.map(b => {
                const isEnabled = enabledBrands[b] !== false;
                const isSelected = activeBrand === b && isEnabled;
                return (
                    <button key={b} type="button" onClick={() => onBrandClick(b)}
                        className={`px-3 py-1.5 text-xs rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                            isSelected
                                ? "bg-[#00A868]/15 text-[#00A868] border-2 border-[#00A868] shadow-sm shadow-[#00A868]/10"
                                : isEnabled
                                    ? "bg-[#00A868]/5 text-foreground border-2 border-[#00A868]/25 hover:border-[#00A868]/50"
                                    : "bg-secondary/30 text-muted-foreground/40 border-2 border-transparent line-through opacity-40 hover:opacity-60"
                        }`}>
                        <BrandIcon brand={b} size={14} />
                        {b}
                    </button>
                );
            })}
            {/* + button to open modal */}
            <button type="button" onClick={onOpenModal}
                className="w-8 h-8 rounded-xl border-2 border-dashed border-[#00A868]/30 text-[#00A868] hover:bg-[#00A868]/10 hover:border-[#00A868] flex items-center justify-center transition-all text-lg font-light">
                +
            </button>
        </div>
    );
}
