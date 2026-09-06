// Shared style helpers implementing the app's design language: warm paper
// background, IBM Plex type family, a burnt-orange accent, and card
// surfaces with a left accent border. All colors are theme tokens (see
// app/globals.css) so light/dark both fall out automatically.

export function primaryButtonClass(extra = ""): string {
  return `bg-accent hover:opacity-90 text-white rounded-md font-condensed font-semibold transition-opacity disabled:opacity-40 disabled:pointer-events-none ${extra}`;
}

export function secondaryButtonClass(extra = ""): string {
  return `border border-line hover:border-line-strong bg-surface text-ink rounded-md font-condensed font-semibold transition-colors disabled:opacity-40 disabled:pointer-events-none ${extra}`;
}

export function inputClass(extra = ""): string {
  return `bg-surface border border-line rounded-md text-ink placeholder:text-muted outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-shadow ${extra}`;
}

// The signature card pattern from the reference design: a surface panel
// with a thin border all around and a thicker accent-colored left edge.
export function cardClass(extra = ""): string {
  return `bg-surface border border-line border-l-4 border-l-accent rounded-md card-shadow ${extra}`;
}

// Small uppercase mono label used above headings/sections.
export function eyebrowClass(extra = ""): string {
  return `font-mono text-xs uppercase tracking-widest text-accent font-semibold ${extra}`;
}

// Uppercase section header with a bottom rule, used to break up a page
// into named sections (e.g. "Last 28 days", "Start a workout").
export function sectionTitleClass(extra = ""): string {
  return `font-condensed font-semibold text-sm uppercase tracking-wide text-muted pb-2 border-b border-line ${extra}`;
}

type PillVariant = "quick" | "strategic" | "neutral";

const PILL_VARIANTS: Record<PillVariant, string> = {
  quick: "bg-quick-soft text-quick",
  strategic: "bg-strategic-soft text-strategic",
  neutral: "bg-surface text-muted border border-line",
};

export function pillClass(variant: PillVariant = "neutral", extra = ""): string {
  return `font-mono text-[11px] tracking-wide px-2.5 py-1 rounded-full whitespace-nowrap ${PILL_VARIANTS[variant]} ${extra}`;
}
