/** GitHub linguist color map for language badges */
export const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  Go: '#00ADD8',
  Rust: '#CE422B',
  Java: '#b07219',
  C: '#555555',
  'C++': '#f34b7d',
  'C#': '#178600',
  Ruby: '#701516',
  Swift: '#FA7343',
  Kotlin: '#A97BFF',
  HTML: '#e34c26',
  CSS: '#663399',
  Shell: '#89e051',
  Dart: '#00B4AB',
  Lua: '#000080',
  PHP: '#4F5D95',
  R: '#198CE7',
  Scala: '#DC322F',
  Haskell: '#5e5086',
  Elixir: '#6e4a7e',
  Vue: '#2c3e50',
  Svelte: '#ff3e00',
  Dockerfile: '#384d54',
  Makefile: '#427819',
  Nix: '#7e7eff',
  Zig: '#ec915c',
  OCaml: '#ef7a08',
  'Jupyter Notebook': '#DA5B0B',
  SCSS: '#c6538c',
  Perl: '#0298c3',
};

/** Returns the GitHub linguist color for a language, or a fallback gray */
export function getLanguageColor(language: string): string {
  return LANGUAGE_COLORS[language] ?? '#8b949e';
}
