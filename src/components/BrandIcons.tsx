/**
 * Brand card network icons — real logos from CDN
 * Primary: credit-card-logos@1.0.5 (jsDelivr) — Visa, Mastercard, Amex
 * Secondary: aaronfagan/svg-credit-card-payment-icons (GitHub) — Elo, Hipercard, Cabal
 */

const CDN1 = "https://cdn.jsdelivr.net/npm/credit-card-logos@1.0.5/img";
const CDN2 = "https://raw.githubusercontent.com/aaronfagan/svg-credit-card-payment-icons/main/flat-rounded";

const BRAND_MAP: Record<string, string> = {
    "VISA": `${CDN1}/card-logo-visa.svg`,
    "MASTERCARD": `${CDN1}/card-logo-mastercard.svg`,
    "AMEX": `${CDN1}/card-logo-amex.svg`,
    "ELO": `${CDN2}/elo.svg`,
    "HIPERCARD": `${CDN2}/hipercard.svg`,
    "CABAL": `${CDN2}/cabal.svg`,
    "DISCOVER": `${CDN2}/discover.svg`,
    "DINERS": `${CDN2}/diners.svg`,
    "JCB": `${CDN2}/jcb.svg`,
};

function BrandImg({ brand, size }: { brand: string; size: number }) {
    const url = BRAND_MAP[brand.toUpperCase()];
    if (!url) {
        return <span className="text-[9px] font-bold text-muted-foreground bg-muted rounded px-1 py-0.5">{brand.slice(0, 4)}</span>;
    }
    return (
        <img
            src={url}
            alt={brand}
            width={size * 1.5}
            height={size}
            className="object-contain rounded-[3px]"
            style={{ width: size * 1.5, height: size }}
            loading="lazy"
        />
    );
}

export function BrandIcon({ brand, size = 20 }: { brand: string; size?: number }) {
    const key = brand.toUpperCase();

    if (key === "VISA/MASTER") {
        return (
            <span className="flex items-center -space-x-1">
                <BrandImg brand="VISA" size={size} />
                <BrandImg brand="MASTERCARD" size={size} />
            </span>
        );
    }

    return <BrandImg brand={key} size={size} />;
}

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
