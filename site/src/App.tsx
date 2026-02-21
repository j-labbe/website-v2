import { SkipToContent } from "./components/SkipToContent/SkipToContent";
import { Navbar } from "./components/Navbar/Navbar";
import { Hero } from "./components/Hero/Hero";
import { Divider } from "./components/Divider/Divider";
import { CommitGraph } from "./components/CommitGraph/CommitGraph";
import { Timeline } from "./components/Timeline/Timeline";
import { Footer } from "./components/Footer/Footer";
import { ScrollToTop } from "./components/ScrollToTop/ScrollToTop";
import { useR2Data } from "./hooks/useR2Data";
import { useFontsReady } from "./hooks/useFontsReady";
import { useStagedReveal } from "./hooks/useStagedReveal";
import { stagger } from "./utils/stagger";

export default function App() {
  const r2State = useR2Data();
  const fontsReady = useFontsReady();

  const isReady =
    fontsReady && (r2State.status === "loaded" || r2State.status === "error");

  if (r2State.status === "error") {
    console.error("[R2] Data fetch failed:", r2State.error);
  }

  // 0-3: hero internals, 4+: rest of page
  const { phase, isVisible } = useStagedReveal(isReady, 8);

  return (
    <div className={`relative transition-opacity duration-300 ${phase === "blank" ? "opacity-0" : "opacity-100"}`}>
      <title>Jack Labbe - Software / AI Engineer</title>
      <meta
        name="description"
        content="Software and AI engineer. View my live commit activity, projects, and contributions."
      />
      <meta property="og:title" content="Jack Labbe - Software / AI Engineer" />
      <meta
        property="og:description"
        content="Software and AI engineer. View my live commit activity, projects, and contributions."
      />
      <meta property="og:image" content="https://jacklabbe.com/og-image.png" />
      <meta property="og:url" content="https://jacklabbe.com" />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta
        name="twitter:title"
        content="Jack Labbe - Software / AI Engineer"
      />
      <meta
        name="twitter:description"
        content="Software and AI engineer. View my live commit activity, projects, and contributions."
      />
      <meta name="twitter:image" content="https://jacklabbe.com/og-image.png" />

      <SkipToContent />
      <Navbar />
      <main id="main-content">
        <Hero phase={phase} isVisible={isVisible} />
        <div className={stagger(isVisible(4))}>
          <Divider />
        </div>
        <div className={`max-w-[1200px] mx-auto px-8 ${stagger(isVisible(5))}`}>
          {r2State.status === "loaded" && r2State.data.graph ? (
            <CommitGraph data={r2State.data.graph} />
          ) : r2State.status === "error" ? (
            <div className="py-4">
              <p className="text-text-dim font-mono text-sm">Data unavailable</p>
            </div>
          ) : null}
        </div>
        <div className={stagger(isVisible(6))}>
          <Divider />
        </div>
        <div className={`max-w-[1200px] mx-auto px-8 ${stagger(isVisible(7))}`}>
          {r2State.status === "loaded" && r2State.data.projects ? (
            <Timeline projects={r2State.data.projects} />
          ) : r2State.status === "error" ? (
            <div className="py-4">
              <p className="text-text-dim font-mono text-sm">Data unavailable</p>
            </div>
          ) : null}
        </div>
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
