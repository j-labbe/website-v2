import styles from './App.module.css';
import { SkipToContent } from './components/SkipToContent/SkipToContent';
import { Navbar } from './components/Navbar/Navbar';
import { Hero } from './components/Hero/Hero';
import { Divider } from './components/Divider/Divider';
import { SectionPlaceholder } from './components/SectionPlaceholder/SectionPlaceholder';
import { Footer } from './components/Footer/Footer';
import { useR2Data } from './hooks/useR2Data';
import { useFontsReady } from './hooks/useFontsReady';

export default function App() {
  const r2State = useR2Data();
  const fontsReady = useFontsReady();

  const isReady =
    fontsReady &&
    (r2State.status === 'loaded' || r2State.status === 'error');

  if (r2State.status === 'error') {
    console.error('[R2] Data fetch failed:', r2State.error);
  }

  return (
    <div className={styles.app}>
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
      <meta
        name="twitter:image"
        content="https://jacklabbe.com/og-image.png"
      />

      <SkipToContent />
      <Navbar />
      <main id="main-content">
        <Hero isLoading={!isReady} />
        <Divider />
        <SectionPlaceholder label="// commit graph" />
        <Divider />
        <SectionPlaceholder label="// projects" />
      </main>
      <Footer />
    </div>
  );
}
