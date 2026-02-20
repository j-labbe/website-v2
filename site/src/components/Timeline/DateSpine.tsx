interface DateSpineProps {
  months: { key: string; label: string }[];
  activeMonth: string | null;
}

/** Converts "February 2026" to "02/26" */
function abbreviateMonth(key: string): string {
  const [year, month] = key.split('-');
  return `${month}/${year.slice(2)}`;
}

export function DateSpine({ months, activeMonth }: DateSpineProps) {
  function handleClick(key: string) {
    document.getElementById('month-' + key)?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <nav aria-label="Timeline navigation" className="sticky top-20 self-start h-fit w-28 max-md:w-16">
      <ul className="flex flex-col">
        {months.map(({ key, label }) => {
          const isActive = 'month-' + key === activeMonth;
          return (
            <li key={key}>
              <button
                onClick={() => handleClick(key)}
                className={`spine-month w-full text-left py-1 text-xs transition-colors ${
                  isActive ? 'font-bold text-accent' : 'text-text-dim'
                }`}
              >
                <span className="max-md:hidden">{label}</span>
                <span className="md:hidden">{abbreviateMonth(key)}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
