export function HeroSkeleton() {
  return (
    <section className="bg-[radial-gradient(ellipse_at_70%_50%,var(--color-accent-glow),var(--color-bg)_70%)] py-20">
      <div className="max-w-[1200px] mx-auto px-8 flex items-center gap-16 max-md:flex-col max-md:text-center">
        <div className="shrink-0 max-w-80 w-1/2 max-md:max-w-[200px] max-md:mx-auto max-md:w-full">
          <div className="w-full aspect-[4/5] rounded-lg skeleton" />
        </div>
        <div className="flex-1 flex flex-col gap-3 max-md:items-center">
          <div className="w-3/5 h-16 rounded-lg skeleton" />
          <div className="w-2/5 h-5 rounded-lg skeleton" />
          <div className="w-[120px] h-12 rounded-full mt-2 skeleton" />
        </div>
      </div>
    </section>
  );
}
