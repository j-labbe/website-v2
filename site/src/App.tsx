import { About } from "./components/About";
import { CommitGraph } from "./components/CommitGraph";
import { Container } from "./components/Container";
import { DataErrorMessage } from "./components/DataErrorMesage";
import { Footer } from "./components/Footer/Footer";
import { Head } from "./components/Head";
import { Hero } from "./components/Hero/Hero";
import { Navbar } from "./components/Navbar";
import { ScrollToTop } from "./components/ScrollToTop/ScrollToTop";
import { SectionHeader } from "./components/SectionHeader";
import { Timeline } from "./components/Timeline/Timeline";
import { useFontsReady } from "./hooks/useFontsReady";
import { useR2Data } from "./hooks/useR2Data";
import { useStagedReveal } from "./hooks/useStagedReveal";

export default function App() {
    const dataState = useR2Data();
    const fontsReady = useFontsReady();

    const isReady = fontsReady && (dataState.status === "loaded" || dataState.status === "error");

    if (dataState.status === "error") {
        console.error("[R2] Data fetch failed:", dataState.error);
    }

    // 0-3: hero internals, 4+: rest of page
    const { phase, isVisible } = useStagedReveal(isReady, 8);

    const graphDataLoaded = dataState.status === "loaded" && dataState.data.graph;
    const timelineDataLoaded = dataState.status === "loaded" && dataState.data.projects;

    const graphData = graphDataLoaded ? dataState.data.graph : null;

    const timelineData = timelineDataLoaded ? dataState.data.projects : null;

    return (
        <div className={`relative transition-opacity duration-300 ${phase === "blank" ? "opacity-0" : "opacity-100"}`}>
            <Head />
            <Navbar />
            <main id="main-content">
                <Hero phase={phase} isVisible={isVisible} />

                <Container>
                    <SectionHeader text="about" />
                    <About />
                </Container>

                <Container>
                    <SectionHeader
                        text="activity"
                        infoTooltip="Recent Github commits made by j-labbe. Does not include work accounts"
                    />
                    {graphData ? (
                        <CommitGraph data={graphData.days} />
                    ) : (
                        <DataErrorMessage message="An error occurred while loading activity data. Please try again later." />
                    )}
                </Container>

                <Container>
                    <SectionHeader text="projects" infoTooltip="Currently only has running 2 years of data" />
                    {timelineData ? (
                        <Timeline projects={timelineData} />
                    ) : (
                        <DataErrorMessage message="An error occurred while loading project data. Please try again later." />
                    )}
                </Container>
            </main>
            <Footer />
            <ScrollToTop />
        </div>
    );
}
