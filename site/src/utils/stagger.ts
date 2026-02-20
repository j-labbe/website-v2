export function stagger(visible: boolean): string {
  return `stagger-item${visible ? " visible" : ""}`;
}

export function crossfadeLayer(active: boolean): string {
  if (active) return "transition-opacity duration-300 opacity-100";
  return "transition-opacity duration-300 opacity-0 absolute inset-0 pointer-events-none";
}
