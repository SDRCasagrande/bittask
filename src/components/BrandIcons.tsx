/**
 * Brand card network icons — inline SVGs for VISA, Mastercard, ELO, AMEX, Hipercard, CABAL
 */

export function BrandIcon({ brand, size = 20 }: { brand: string; size?: number }) {
    const key = brand.toUpperCase();

    if (key === "VISA/MASTER" || key === "VISA" || key === "MASTERCARD") {
        // Combined Visa + Mastercard
        return (
            <span className="flex items-center gap-0.5">
                <VisaIcon size={size} />
                <MastercardIcon size={size} />
            </span>
        );
    }
    if (key === "ELO") return <EloIcon size={size} />;
    if (key === "AMEX" || key === "AMERICAN EXPRESS") return <AmexIcon size={size} />;
    if (key === "HIPERCARD") return <HipercardIcon size={size} />;
    if (key === "CABAL") return <CabalIcon size={size} />;

    // Fallback
    return <span className="text-[9px] font-bold text-muted-foreground">{brand}</span>;
}

function VisaIcon({ size = 20 }: { size?: number }) {
    return (
        <svg width={size * 1.4} height={size} viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="48" height="32" rx="4" fill="#1A1F71" />
            <path d="M20.4 21.5h-2.8l1.8-10.8h2.8L20.4 21.5z" fill="#fff" />
            <path d="M30.2 10.9c-.6-.2-1.4-.4-2.5-.4-2.8 0-4.7 1.5-4.7 3.6 0 1.6 1.4 2.5 2.5 3 1.1.5 1.5.9 1.5 1.4 0 .7-.9 1.1-1.7 1.1-1.1 0-1.8-.2-2.7-.6l-.4-.2-.4 2.5c.7.3 1.9.6 3.2.6 2.9 0 4.9-1.5 4.9-3.7 0-1.2-.7-2.2-2.4-3-.9-.5-1.5-.8-1.5-1.3 0-.4.5-.9 1.5-.9.9 0 1.5.2 2 .4l.2.1.4-2.6z" fill="#fff" />
            <path d="M34.5 10.7h-2.2c-.7 0-1.2.2-1.5.9l-4.2 10h2.9l.6-1.6h3.6l.3 1.6h2.6l-2.1-10.9zm-3.5 7l1.5-4 .8 4h-2.3z" fill="#fff" />
            <path d="M17.4 10.7l-2.7 7.4-.3-1.5c-.5-1.7-2-3.5-3.7-4.4l2.5 9.3h3l4.4-10.8h-3.2z" fill="#fff" />
            <path d="M12.2 10.7H7.8l-.1.3c3.5.9 5.9 3.1 6.8 5.7l-1-5c-.1-.6-.6-.9-1.3-1z" fill="#F7B600" />
        </svg>
    );
}

function MastercardIcon({ size = 20 }: { size?: number }) {
    return (
        <svg width={size * 1.4} height={size} viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="48" height="32" rx="4" fill="#252525" />
            <circle cx="19" cy="16" r="8" fill="#EB001B" />
            <circle cx="29" cy="16" r="8" fill="#F79E1B" />
            <path d="M24 10.1a8 8 0 0 0-3 5.9 8 8 0 0 0 3 5.9 8 8 0 0 0 3-5.9 8 8 0 0 0-3-5.9z" fill="#FF5F00" />
        </svg>
    );
}

function EloIcon({ size = 20 }: { size?: number }) {
    return (
        <svg width={size * 1.4} height={size} viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="48" height="32" rx="4" fill="#000" />
            <text x="10" y="20" fill="#FFCB05" fontFamily="Arial" fontWeight="900" fontSize="14" letterSpacing="-0.5">e</text>
            <text x="19" y="20" fill="#00A4E0" fontFamily="Arial" fontWeight="900" fontSize="14" letterSpacing="-0.5">l</text>
            <text x="25" y="20" fill="#EF4123" fontFamily="Arial" fontWeight="900" fontSize="14" letterSpacing="-0.5">o</text>
            <circle cx="37" cy="12" r="3" fill="#FFCB05" />
            <circle cx="37" cy="20" r="3" fill="#00A4E0" />
            <circle cx="37" cy="16" r="2" fill="#EF4123" />
        </svg>
    );
}

function AmexIcon({ size = 20 }: { size?: number }) {
    return (
        <svg width={size * 1.4} height={size} viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="48" height="32" rx="4" fill="#016FD0" />
            <text x="24" y="14" fill="white" fontFamily="Arial" fontWeight="900" fontSize="7" textAnchor="middle" letterSpacing="0.5">AMERICAN</text>
            <text x="24" y="22" fill="white" fontFamily="Arial" fontWeight="900" fontSize="7" textAnchor="middle" letterSpacing="0.5">EXPRESS</text>
        </svg>
    );
}

function HipercardIcon({ size = 20 }: { size?: number }) {
    return (
        <svg width={size * 1.4} height={size} viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="48" height="32" rx="4" fill="#822124" />
            <text x="24" y="18" fill="white" fontFamily="Arial" fontWeight="800" fontSize="8" textAnchor="middle" letterSpacing="0.3">HIPER</text>
            <rect x="6" y="22" width="36" height="3" rx="1.5" fill="#F5A623" />
        </svg>
    );
}

function CabalIcon({ size = 20 }: { size?: number }) {
    return (
        <svg width={size * 1.4} height={size} viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="48" height="32" rx="4" fill="#00529B" />
            <text x="24" y="19" fill="white" fontFamily="Arial" fontWeight="800" fontSize="10" textAnchor="middle" letterSpacing="1">CABAL</text>
            <rect x="8" y="6" width="14" height="3" rx="1.5" fill="#E31837" />
            <rect x="26" y="6" width="14" height="3" rx="1.5" fill="#009B3A" />
        </svg>
    );
}

/**
 * Get the brand color for UI accents
 */
export function getBrandColor(brand: string): string {
    const colors: Record<string, string> = {
        "VISA/MASTER": "#1A1F71",
        "VISA": "#1A1F71",
        "MASTERCARD": "#EB001B",
        "ELO": "#FFCB05",
        "AMEX": "#016FD0",
        "HIPERCARD": "#822124",
        "CABAL": "#00529B",
    };
    return colors[brand.toUpperCase()] || "#6b7280";
}
