// Shared button/input styling. The page background flips to near-black in
// dark mode (see app/globals.css), which silently broke every solid
// `bg-black` button (a near-black button on a near-black page is
// effectively invisible) and left inputs with unstyled browser-default
// backgrounds/focus rings. These use an explicit accent color and
// light/dark-aware colors instead, so nothing depends on default rendering.

export function primaryButtonClass(extra = ""): string {
  return `bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white rounded-lg font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none ${extra}`;
}

export function secondaryButtonClass(extra = ""): string {
  return `border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none ${extra}`;
}

export function inputClass(extra = ""): string {
  return `bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-shadow ${extra}`;
}
