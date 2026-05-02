type Variant = "full" | "horizontal" | "isotipo" | "wordmark";
type Mono = "gold" | "green" | "pink" | "black" | "white" | null;

interface FmGlowLogoProps {
  size?: number;
  variant?: Variant;
  mono?: Mono;
  bg?: string;
}

export function FmGlowLogo({
  size = 400,
  variant = "full",
  mono = null,
  bg = "transparent",
}: FmGlowLogoProps) {
  const colors = (() => {
    if (mono === "black")  return { gold: "#1a1a1a", goldLeaf: "#1a1a1a", script: "#1a1a1a", lash: "#1a1a1a", sans: "#1a1a1a", tagline: "#1a1a1a", dots: "#1a1a1a" };
    if (mono === "white")  return { gold: "#ffffff", goldLeaf: "#ffffff", script: "#ffffff", lash: "#ffffff", sans: "#ffffff", tagline: "#ffffff", dots: "#ffffff" };
    if (mono === "gold")   return { gold: "#c8a25f", goldLeaf: "#c8a25f", script: "#c8a25f", lash: "#c8a25f", sans: "#c8a25f", tagline: "#c8a25f", dots: "#c8a25f" };
    if (mono === "green")  return { gold: "#2f4f43", goldLeaf: "#2f4f43", script: "#2f4f43", lash: "#2f4f43", sans: "#2f4f43", tagline: "#2f4f43", dots: "#2f4f43" };
    if (mono === "pink")   return { gold: "#c794a8", goldLeaf: "#c794a8", script: "#c794a8", lash: "#c794a8", sans: "#c794a8", tagline: "#c794a8", dots: "#c794a8" };
    return { gold: "url(#fmg-gold)", goldLeaf: "url(#fmg-gold-leaf)", script: "#c794a8", lash: "#d4a3b8", sans: "#2f4f43", tagline: "#c794a8", dots: "#c794a8" };
  })();

  if (variant === "isotipo") {
    return (
      <svg width={size} height={size} viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="fmg-iso-gold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e0c084" />
            <stop offset="50%" stopColor="#c8a25f" />
            <stop offset="100%" stopColor="#a07a3a" />
          </linearGradient>
        </defs>
        <path d="M 300 50 A 250 250 0 1 1 470 540" fill="none" stroke={mono ? colors.gold : "url(#fmg-iso-gold)"} strokeWidth="3" strokeLinecap="round" />
        <text x="300" y="340" fontFamily="'Allura', var(--font-allura), 'Pinyon Script', cursive" fontSize="220" fill={colors.script} textAnchor="middle">fm</text>
        <path d="M 200 360 Q 300 380 410 340" fill="none" stroke={colors.script} strokeWidth="2" strokeLinecap="round" />
        <g fill="none" stroke={colors.lash} strokeWidth="2.5" strokeLinecap="round">
          <path d="M 405 285 Q 440 282 472 270" />
          <path d="M 415 305 Q 448 305 478 297" />
          <path d="M 418 322 Q 442 328 467 328" />
          <path d="M 410 336 Q 430 350 447 360" />
          <path d="M 402 348 Q 418 365 428 380" />
        </g>
      </svg>
    );
  }

  if (variant === "wordmark") {
    return (
      <svg width={size} height={size * 0.35} viewBox="0 0 800 280" xmlns="http://www.w3.org/2000/svg">
        <text x="400" y="120" fontFamily="'Montserrat', var(--font-montserrat), sans-serif" fontSize="86" fontWeight="500" fill={colors.sans} textAnchor="middle" letterSpacing="2">GLOW STUDIO</text>
        <circle cx="180" cy="200" r="3" fill={colors.tagline} />
        <text x="400" y="210" fontFamily="'Montserrat', var(--font-montserrat), sans-serif" fontSize="28" fontWeight="500" fill={colors.tagline} textAnchor="middle" letterSpacing="3">BY:FABIANA MADRIGAL</text>
        <circle cx="620" cy="200" r="3" fill={colors.tagline} />
      </svg>
    );
  }

  if (variant === "horizontal") {
    return (
      <svg width={size} height={size * 0.38} viewBox="0 0 1300 500" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="fmg-h-gold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e0c084" />
            <stop offset="50%" stopColor="#c8a25f" />
            <stop offset="100%" stopColor="#a07a3a" />
          </linearGradient>
        </defs>
        <g transform="translate(0, 20)">
          <path d="M 230 30 A 210 210 0 1 1 370 460" fill="none" stroke={mono ? colors.gold : "url(#fmg-h-gold)"} strokeWidth="2.8" strokeLinecap="round" />
          <text x="230" y="270" fontFamily="'Allura', var(--font-allura), 'Pinyon Script', cursive" fontSize="170" fill={colors.script} textAnchor="middle">fm</text>
          <path d="M 145 285 Q 230 300 320 270" fill="none" stroke={colors.script} strokeWidth="2" strokeLinecap="round" />
          <g fill="none" stroke={colors.lash} strokeWidth="2" strokeLinecap="round">
            <path d="M 315 230 Q 345 228 372 218" />
            <path d="M 322 245 Q 350 247 378 240" />
            <path d="M 322 260 Q 345 266 365 268" />
          </g>
        </g>
        <g transform="translate(500, 0)">
          <text x="0" y="240" fontFamily="'Montserrat', var(--font-montserrat), sans-serif" fontSize="100" fontWeight="500" fill={colors.sans} letterSpacing="2">GLOW STUDIO</text>
          <circle cx="0" cy="330" r="3" fill={colors.tagline} />
          <text x="20" y="340" fontFamily="'Montserrat', var(--font-montserrat), sans-serif" fontSize="32" fontWeight="500" fill={colors.tagline} letterSpacing="3">BY:FABIANA MADRIGAL</text>
          <circle cx="730" cy="330" r="3" fill={colors.tagline} />
        </g>
      </svg>
    );
  }

  // variant === "full"
  return (
    <svg width={size} height={size} viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg" style={{ background: bg }}>
      <defs>
        <linearGradient id="fmg-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e0c084" />
          <stop offset="50%" stopColor="#c8a25f" />
          <stop offset="100%" stopColor="#a07a3a" />
        </linearGradient>
        <linearGradient id="fmg-gold-leaf" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d4a85e" />
          <stop offset="100%" stopColor="#a07b34" />
        </linearGradient>
      </defs>

      {/* Anillo dorado */}
      <path d="M 500 80 A 420 420 0 1 1 770 870" fill="none" stroke={colors.gold} strokeWidth="3.5" strokeLinecap="round" />

      {/* Rama de olivo */}
      <g>
        <path d="M 70 470 Q 110 320 170 200" fill="none" stroke={colors.goldLeaf} strokeWidth="2.5" strokeLinecap="round" />
        <ellipse cx="130" cy="240" rx="42" ry="12" fill={colors.goldLeaf} transform="rotate(-65 130 240)" opacity="0.95" />
        <ellipse cx="105" cy="285" rx="45" ry="13" fill={colors.goldLeaf} transform="rotate(-50 105 285)" opacity="0.95" />
        <ellipse cx="95" cy="345" rx="42" ry="12" fill={colors.goldLeaf} transform="rotate(-30 95 345)" opacity="0.95" />
        <ellipse cx="160" cy="205" rx="34" ry="11" fill={colors.goldLeaf} transform="rotate(40 160 205)" opacity="0.9" />
        <ellipse cx="175" cy="250" rx="36" ry="11" fill={colors.goldLeaf} transform="rotate(20 175 250)" opacity="0.9" />
        <ellipse cx="155" cy="325" rx="38" ry="12" fill={colors.goldLeaf} transform="rotate(10 155 325)" opacity="0.9" />
        <ellipse cx="135" cy="400" rx="34" ry="11" fill={colors.goldLeaf} transform="rotate(-15 135 400)" opacity="0.9" />
        <circle cx="115" cy="222" r="3" fill={colors.goldLeaf} />
        <circle cx="128" cy="268" r="3" fill={colors.goldLeaf} />
        <circle cx="90" cy="320" r="3" fill={colors.goldLeaf} />
        <circle cx="170" cy="285" r="3" fill={colors.goldLeaf} />
        <circle cx="155" cy="365" r="3" fill={colors.goldLeaf} />
      </g>

      {/* fm script */}
      <text x="500" y="395" fontFamily="'Allura', var(--font-allura), 'Pinyon Script', cursive" fontSize="240" fill={colors.script} textAnchor="middle">fm</text>
      <path d="M 350 410 Q 480 430 615 385" fill="none" stroke={colors.script} strokeWidth="2.5" strokeLinecap="round" />

      {/* Pestaña */}
      <g fill="none" stroke={colors.lash} strokeWidth="2.5" strokeLinecap="round">
        <path d="M 600 320 Q 635 318 670 305" />
        <path d="M 612 340 Q 645 340 675 332" />
        <path d="M 615 358 Q 640 365 665 365" />
        <path d="M 608 372 Q 628 388 645 398" />
        <path d="M 600 385 Q 615 405 625 420" />
      </g>

      {/* GLOW STUDIO */}
      <text x="500" y="570" fontFamily="'Montserrat', var(--font-montserrat), sans-serif" fontSize="98" fontWeight="500" fill={colors.sans} textAnchor="middle" letterSpacing="2">GLOW STUDIO</text>

      {/* BY:FABIANA MADRIGAL */}
      <circle cx="245" cy="685" r="3" fill={colors.tagline} />
      <text x="500" y="695" fontFamily="'Montserrat', var(--font-montserrat), sans-serif" fontSize="34" fontWeight="500" fill={colors.tagline} textAnchor="middle" letterSpacing="3">BY:FABIANA MADRIGAL</text>
      <circle cx="755" cy="685" r="3" fill={colors.tagline} />

      {/* Hilera de puntos rosa */}
      <g fill={colors.dots}>
        <circle cx="640" cy="780" r="6" />
        <circle cx="680" cy="800" r="7" />
        <circle cx="720" cy="815" r="8" />
        <circle cx="760" cy="820" r="9" />
        <circle cx="800" cy="815" r="8" />
        <circle cx="835" cy="800" r="6" />
        <circle cx="865" cy="775" r="5" />
      </g>
    </svg>
  );
}
