export default function ForestBackdrop() {
  return (
    <div className="forest-backdrop" aria-hidden="true">
      {/* Night sky gradients & aurora mist */}
      <div className="sky-mist mist-1" />
      <div className="sky-mist mist-2" />
      <div className="sky-mist campfire-glow" />

      {/* Twinkling forest fireflies / stars */}
      <div className="fireflies">
        {Array.from({ length: 18 }).map((_, i) => (
          <span key={i} className={`firefly firefly-${(i % 6) + 1}`} style={{
            left: `${(i * 19 + 7) % 96}%`,
            top: `${(i * 23 + 11) % 85}%`,
            animationDelay: `${(i * 0.42) % 4}s`,
            animationDuration: `${3.5 + (i % 5) * 0.8}s`
          }} />
        ))}
      </div>

      {/* SVG Treeline: Left Side Pines */}
      <svg className="treeline treeline-left" viewBox="0 0 320 800" preserveAspectRatio="none" fill="none">
        {/* Distant misty pines (lighter emerald silhouette) */}
        <g opacity="0.35" fill="var(--pine-distant)">
          <path d="M70,800 L70,420 L50,450 L70,390 L55,415 L70,350 L60,370 L70,310 L75,310 L85,370 L75,350 L90,415 L75,390 L95,450 L75,420 L75,800 Z" />
          <path d="M140,800 L140,360 L120,395 L140,330 L125,360 L140,290 L130,315 L140,240 L146,240 L156,315 L146,290 L161,360 L146,330 L166,395 L146,360 L146,800 Z" />
          <path d="M210,800 L210,480 L195,510 L210,450 L198,475 L210,410 L202,430 L210,370 L215,370 L223,430 L215,410 L227,475 L215,450 L230,510 L215,480 L215,800 Z" />
        </g>
        {/* Midground pines */}
        <g opacity="0.65" fill="var(--pine-mid)">
          <path d="M30,800 L30,260 L8,300 L30,220 L12,255 L30,170 L18,200 L30,120 L36,120 L48,200 L36,170 L54,255 L36,220 L60,300 L36,260 L36,800 Z" />
          <path d="M100,800 L100,290 L75,335 L100,250 L80,290 L100,200 L88,230 L100,150 L107,150 L119,230 L107,200 L127,290 L107,250 L132,335 L107,290 L107,800 Z" />
          <path d="M170,800 L170,410 L150,445 L170,370 L155,400 L170,320 L160,345 L170,260 L176,260 L186,345 L176,320 L191,400 L176,370 L196,445 L176,410 L176,800 Z" />
        </g>
        {/* Foreground dense pines (dark silhouette framing the viewport) */}
        <g opacity="0.95" fill="var(--pine-front)">
          <path d="M-20,800 L-20,180 L-50,225 L-20,140 L-45,180 L-20,90 L-35,125 L-20,30 L-10,30 L5,125 L-10,90 L15,180 L-10,140 L25,225 L-10,180 L-10,800 Z" />
          <path d="M45,800 L45,210 L15,260 L45,160 L20,205 L45,100 L30,135 L45,50 L53,50 L68,135 L53,100 L78,205 L53,160 L85,260 L53,210 L53,800 Z" />
          <path d="M-10,800 L0,500 L80,560 L150,650 L240,730 L320,800 Z" />
        </g>
      </svg>

      {/* SVG Treeline: Right Side Pines */}
      <svg className="treeline treeline-right" viewBox="0 0 320 800" preserveAspectRatio="none" fill="none">
        {/* Distant pines */}
        <g opacity="0.35" fill="var(--pine-distant)">
          <path d="M110,800 L110,480 L95,510 L110,450 L98,475 L110,410 L102,430 L110,370 L115,370 L123,430 L115,410 L127,475 L115,450 L130,510 L115,480 L115,800 Z" />
          <path d="M180,800 L180,360 L160,395 L180,330 L165,360 L180,290 L170,315 L180,240 L186,240 L196,315 L186,290 L201,360 L186,330 L206,395 L186,360 L186,800 Z" />
          <path d="M250,800 L250,420 L230,450 L250,390 L235,415 L250,350 L240,370 L250,310 L255,310 L265,370 L255,350 L270,415 L255,390 L275,450 L255,420 L255,800 Z" />
        </g>
        {/* Midground pines */}
        <g opacity="0.65" fill="var(--pine-mid)">
          <path d="M150,800 L150,410 L130,445 L150,370 L135,400 L150,320 L140,345 L150,260 L156,260 L166,345 L156,320 L171,400 L156,370 L176,445 L156,410 L156,800 Z" />
          <path d="M220,800 L220,290 L195,335 L220,250 L200,290 L220,200 L208,230 L220,150 L227,150 L239,230 L227,200 L247,290 L227,250 L252,335 L227,290 L227,800 Z" />
          <path d="M290,800 L290,260 L268,300 L290,220 L272,255 L290,170 L278,200 L290,120 L296,120 L308,200 L296,170 L314,255 L296,220 L320,300 L296,260 L296,800 Z" />
        </g>
        {/* Foreground dense pines */}
        <g opacity="0.95" fill="var(--pine-front)">
          <path d="M275,800 L275,210 L245,260 L275,160 L250,205 L275,100 L260,135 L275,50 L283,50 L298,135 L283,100 L308,205 L283,160 L315,260 L283,210 L283,800 Z" />
          <path d="M340,800 L340,180 L310,225 L340,140 L315,180 L340,90 L325,125 L340,30 L350,30 L365,125 L350,90 L375,180 L350,140 L385,225 L350,180 L350,800 Z" />
          <path d="M0,800 L80,730 L170,650 L240,560 L320,500 L330,800 Z" />
        </g>
      </svg>

      {/* Subtle bottom forest floor ridge */}
      <div className="forest-floor" />
    </div>
  );
}
