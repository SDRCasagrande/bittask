"use client";

import { useState, useEffect, useRef } from "react";

/**
 * Rate Input component — defined OUTSIDE page components and uses
 * focus-aware sync so typing is never interrupted by parent re-renders.
 */
export function RI({ l, v, set }: { l: string; v: number; set: (n: number) => void }) {
    const [txt, setTxt] = useState(String(v));
    const focused = useRef(false);

    // Only sync from parent when NOT focused (prevents feedback loop)
    useEffect(() => {
        if (!focused.current) setTxt(String(v));
    }, [v]);

    return (
        <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">{l}</label>
            <div className="relative">
                <input type="text" inputMode="decimal" value={txt}
                    onFocus={() => { focused.current = true; }}
                    onChange={(e) => {
                        setTxt(e.target.value);
                        const n = parseFloat(e.target.value.replace(",", "."));
                        if (!isNaN(n)) set(n);
                    }}
                    onBlur={() => {
                        focused.current = false;
                        const n = parseFloat(txt.replace(",", "."));
                        if (!isNaN(n)) { set(n); setTxt(String(n)); }
                        else { set(0); setTxt("0"); }
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm font-semibold text-right pr-7 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all" />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">%</span>
            </div>
        </div>
    );
}
