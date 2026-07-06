"use client";

import { CheckCircle2 } from "lucide-react";

import { m } from "@/components/motion-primitives";

const roofBaseY = 176;
const roofPeak = { x: 236, y: 58 };
const roofBounds = { left: 62, right: 340 };
const panelEdges = [62, 108, 154, 200, 246, 293, 340] as const;
const sideRidgeEnd = { x: 334, y: 94 };
const sideEaveEnd = { x: 448, y: 188 };
const sideRoofPanels = [
  {
    d: "M236 58 269 70 376 180 340 176Z",
    delay: 1,
    seam: "M269 70 376 180",
  },
  {
    d: "M269 70 302 82 412 184 376 180Z",
    delay: 1.12,
    seam: "M302 82 412 184",
  },
  {
    d: "M302 82 334 94 448 188 412 184Z",
    delay: 1.24,
    seam: "M334 94 448 188",
  },
] as const;

function getRoofY(x: number) {
  const span = x <= roofPeak.x ? roofPeak.x - roofBounds.left : roofBounds.right - roofPeak.x;
  const progress = x <= roofPeak.x ? (x - roofBounds.left) / span : (roofBounds.right - x) / span;

  return Number((roofBaseY - (roofBaseY - roofPeak.y) * progress).toFixed(1));
}

const roofPanels = panelEdges.slice(0, -1).map((x1, index) => {
  const x2 = panelEdges[index + 1];
  const overlap = index === 0 ? 0 : 3;
  const left = x1 - overlap;
  const right = x2 + (index === panelEdges.length - 2 ? 0 : 3);

  return {
    delay: 0.28 + index * 0.12,
    d: `M${left} ${roofBaseY}L${left} ${getRoofY(left)}L${right} ${getRoofY(right)}L${right} ${roofBaseY}Z`,
    seam: `M${x2} ${roofBaseY}L${x2} ${getRoofY(x2)}`,
    xOffset: index < 3 ? -18 : 18,
  };
});

const settleTransition = { duration: 0.82, ease: [0.16, 1, 0.3, 1] } as const;

export function RoofAssemblyVisual() {
  return (
    <m.div
      className="relative min-h-72 w-full overflow-hidden rounded-lg border border-white/10 bg-slate-900/50 p-3 shadow-[0_24px_70px_rgba(2,6,23,0.28)] backdrop-blur md:min-h-96 md:p-6"
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3 }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(20,184,166,0.18),transparent_35%),linear-gradient(145deg,rgba(15,23,42,0.28),rgba(15,118,110,0.12))]" />
      <m.div
        aria-hidden="true"
        className="absolute inset-y-0 left-[-45%] hidden w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent md:block"
        initial={{ x: "-10%", opacity: 0 }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        whileHover={{ x: "420%", opacity: 1 }}
      />
      <div className="relative flex h-full min-h-60 flex-col justify-between md:min-h-80">
        <div className="flex items-center justify-between gap-3 text-xs font-bold uppercase text-teal-100/85">
          <span>Montaj acoperis</span>
          <span className="rounded-full border border-teal-200/20 bg-teal-50/10 px-2.5 py-1 text-teal-100">Montaj vizual</span>
        </div>

        <m.svg
          className="mx-auto h-60 w-full max-w-lg md:h-72"
          fill="none"
          initial="hidden"
          viewBox="0 0 520 360"
          whileInView="show"
          viewport={{ amount: 0.45, once: true }}
        >
          <title>Acoperis metalic montat pe casa</title>
          <defs>
            <clipPath id="roof-assembly-clip">
              <path d={`M${roofPeak.x} ${roofPeak.y} ${roofBounds.left} ${roofBaseY}h${roofBounds.right - roofBounds.left}L${roofPeak.x} ${roofPeak.y}Z`} />
            </clipPath>
            <clipPath id="roof-assembly-side-clip">
              <path d={`M${roofPeak.x} ${roofPeak.y} ${sideRidgeEnd.x} ${sideRidgeEnd.y} ${sideEaveEnd.x} ${sideEaveEnd.y} ${roofBounds.right} ${roofBaseY}Z`} />
            </clipPath>
            <linearGradient id="roof-panel-fill" x1="88" x2="420" y1="72" y2="184" gradientUnits="userSpaceOnUse">
              <stop stopColor="#B9463B" />
              <stop offset="0.52" stopColor="#94322E" />
              <stop offset="1" stopColor="#6F1D1B" />
            </linearGradient>
            <linearGradient id="roof-side-fill" x1="280" x2="448" y1="86" y2="190" gradientUnits="userSpaceOnUse">
              <stop stopColor="#8F2F2C" />
              <stop offset="1" stopColor="#5F1A17" />
            </linearGradient>
            <linearGradient id="house-wall-fill" x1="86" x2="434" y1="162" y2="312" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FFFFFF" />
              <stop offset="1" stopColor="#E2E8F0" />
            </linearGradient>
            <linearGradient id="house-side-fill" x1="340" x2="456" y1="176" y2="310" gradientUnits="userSpaceOnUse">
              <stop stopColor="#E2E8F0" />
              <stop offset="1" stopColor="#CBD5E1" />
            </linearGradient>
            <linearGradient id="glass-fill" x1="140" x2="370" y1="194" y2="263" gradientUnits="userSpaceOnUse">
              <stop stopColor="#E0F2FE" />
              <stop offset="1" stopColor="#BAE6FD" />
            </linearGradient>
          </defs>
          <m.g variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } } }}>
            <path d="M340 176 448 188v122H340Z" fill="url(#house-side-fill)" />
            <path d="M340 176 448 188v122H340Z" stroke="#94A3B8" strokeLinejoin="round" strokeWidth="2.5" />
            <path d="M365 215 414 220.5v36.5l-49-5.5Z" fill="url(#glass-fill)" stroke="#94A3B8" strokeLinejoin="round" strokeWidth="2.5" />
            <path d="M389.5 217.75v36.5M365 233.25l49 5.5" stroke="#94A3B8" strokeOpacity="0.72" strokeWidth="2" />
            <path d="M86 176h254v134H86z" fill="url(#house-wall-fill)" />
            <path d="M86 176h254v134H86z" stroke="#CBD5E1" strokeWidth="2.5" />
            <path d="M86 176h254v18H86z" fill="#CBD5E1" opacity="0.55" />
            <path d="M112 214h56v48h-56z" fill="url(#glass-fill)" stroke="#94A3B8" strokeWidth="2.5" />
            <path d="M262 214h56v48h-56z" fill="url(#glass-fill)" stroke="#94A3B8" strokeWidth="2.5" />
            <path d="M120 238h40M140 214v48M270 238h40M290 214v48" stroke="#94A3B8" strokeOpacity="0.72" strokeWidth="2" />
            <path d="M184 218h62v92h-62z" fill="#E0F2FE" stroke="#94A3B8" strokeWidth="2.5" />
            <path d="M194 228h42v82h-42z" fill="#0F766E" fillOpacity="0.12" />
            <path d="M215 218v92M194 258h42" stroke="#94A3B8" strokeOpacity="0.75" strokeWidth="2" />
            <circle cx="232" cy="266" fill="#0F766E" r="3" />
            <path d="M72 310h382" stroke="#64748B" strokeLinecap="round" strokeOpacity="0.7" strokeWidth="5" />
            <path d="M110 310h324" stroke="#0F172A" strokeLinecap="round" strokeOpacity="0.12" strokeWidth="12" />
          </m.g>

          <m.g
            variants={{
              hidden: { opacity: 0, y: -6 },
              show: { opacity: 1, y: 0, transition: { delay: 1.08, duration: 0.38, ease: [0.22, 1, 0.36, 1] } },
            }}
          >
            <path d={`M69 ${roofBaseY}H${roofBounds.right}L${sideEaveEnd.x} ${sideEaveEnd.y}`} stroke="#020617" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.3" strokeWidth="13" />
            <path d={`M80 178H${roofBounds.right}L${sideEaveEnd.x - 4} 189`} stroke="#7F1D1D" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.64" strokeWidth="6" />
          </m.g>

          <g clipPath="url(#roof-assembly-side-clip)">
            <path d={`M${roofPeak.x} ${roofPeak.y} ${sideRidgeEnd.x} ${sideRidgeEnd.y} ${sideEaveEnd.x} ${sideEaveEnd.y} ${roofBounds.right} ${roofBaseY}Z`} fill="#0F172A" fillOpacity="0.2" />
            {sideRoofPanels.map((panel) => (
              <m.g
                key={panel.d}
                variants={{
                  hidden: { opacity: 0, x: 28, y: -30 },
                  show: { opacity: 1, x: 0, y: 0, transition: { ...settleTransition, delay: panel.delay } },
                }}
              >
                <path d={panel.d} fill="url(#roof-side-fill)" stroke="#FDBA74" strokeLinejoin="round" strokeOpacity="0.28" strokeWidth="2.5" />
                <path d={panel.seam} stroke="#4C0519" strokeLinecap="round" strokeOpacity="0.18" strokeWidth="7" />
                <path d={panel.seam} stroke="#FECACA" strokeLinecap="round" strokeOpacity="0.18" strokeWidth="2" />
              </m.g>
            ))}
          </g>

          <g clipPath="url(#roof-assembly-clip)">
            <path d={`M${roofPeak.x} ${roofPeak.y} ${roofBounds.left} ${roofBaseY}h${roofBounds.right - roofBounds.left}L${roofPeak.x} ${roofPeak.y}Z`} fill="#0F172A" fillOpacity="0.18" />
            {roofPanels.map((panel) => (
              <m.g
                key={panel.d}
                variants={{
                  hidden: { opacity: 0, x: panel.xOffset, y: -42 },
                  show: { opacity: 1, x: 0, y: 0, transition: { ...settleTransition, delay: panel.delay } },
                }}
              >
                <path d={panel.d} fill="url(#roof-panel-fill)" stroke="#FDBA74" strokeLinejoin="round" strokeOpacity="0.34" strokeWidth="2.5" />
                <path d={panel.seam} stroke="#4C0519" strokeLinecap="round" strokeOpacity="0.2" strokeWidth="8" />
                <path d={panel.seam} stroke="#FECACA" strokeLinecap="round" strokeOpacity="0.24" strokeWidth="2.5" />
              </m.g>
            ))}
            <m.g
              variants={{
                hidden: { opacity: 0, y: -4 },
                show: { opacity: 1, y: 0, transition: { delay: 1.16, duration: 0.44, ease: [0.22, 1, 0.36, 1] } },
              }}
            >
              <path d="M99 147h258" stroke="#FECACA" strokeLinecap="round" strokeOpacity="0.2" strokeWidth="3" />
              <path d="M78 164h285" stroke="#FECACA" strokeLinecap="round" strokeOpacity="0.2" strokeWidth="3" />
              <path d="M86 154c31-8 53-8 84 0s53 8 84 0 53-8 84 0" stroke="#4C0519" strokeLinecap="round" strokeOpacity="0.18" strokeWidth="4" />
              <path d="M78 169c35-8 59-8 94 0s59 8 94 0 59-8 94 0" stroke="#4C0519" strokeLinecap="round" strokeOpacity="0.16" strokeWidth="4" />
              <path d="M95 139c28-7 48-7 76 0s48 7 76 0 48-7 76 0" stroke="#FECACA" strokeLinecap="round" strokeOpacity="0.18" strokeWidth="2.5" />
            </m.g>
          </g>

          <m.g
            variants={{
              hidden: { opacity: 0, y: -34, scale: 0.97 },
              show: { opacity: 1, y: [0, 4, 0], scale: 1, transition: { delay: 1.2, duration: 0.72, ease: [0.16, 1, 0.3, 1] } },
            }}
            style={{ transformOrigin: "260px 60px" }}
          >
            <path d={`M${roofPeak.x} 57 52 181h30L${roofPeak.x} 76l98 37 101 78h30L${sideRidgeEnd.x} ${sideRidgeEnd.y} ${roofPeak.x} 57Z`} fill="#7F1D1D" stroke="#FDBA74" strokeLinejoin="round" strokeOpacity="0.55" strokeWidth="3" />
            <path d={`M82 180H${roofBounds.right}L${sideEaveEnd.x - 4} 189`} stroke="#4C0519" strokeLinecap="round" strokeOpacity="0.24" strokeWidth="7" />
            <path d="M105 178 236 86l99 33 90 68" stroke="#FECACA" strokeLinecap="round" strokeOpacity="0.2" strokeWidth="3" />
          </m.g>

          <m.g
            variants={{
              hidden: { opacity: 0, scale: 0.82 },
              show: { opacity: 1, scale: 1, transition: { delay: 1.78, duration: 0.42, ease: [0.22, 1, 0.36, 1] } },
            }}
            style={{ transformOrigin: "404px 95px" }}
          >
            <circle cx="404" cy="95" fill="#0F766E" r="27" />
            <path d="m392 95 8 8 16-18" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="5" />
          </m.g>

        </m.svg>

        <div className="grid gap-2 text-sm text-slate-100 sm:grid-cols-3">
          {["Profil ales", "Necesar calculat", "Oferta verificata"].map((item) => (
            <span className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/10 px-3 py-2 font-semibold" key={item}>
              <CheckCircle2 className="size-4 text-teal-200" />
              {item}
            </span>
          ))}
        </div>
      </div>
    </m.div>
  );
}
