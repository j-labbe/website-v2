import { useEffect, useRef } from "react";
import { About, ABOUT_TEXT } from "./components/About";
import { Banner } from "./components/Banner";
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
import { installWebMCP, type WebMCPSnapshot } from "./webmcp";

export default function App() {
    const { retry, ...dataState } = useR2Data();
    const fontsReady = useFontsReady();

    const isReady = fontsReady && (dataState.status === "loaded" || dataState.status === "error");

    if (dataState.status === "error") {
        console.error("[R2] Data fetch failed:", dataState.error);
    }

    // 0-3: hero internals, 4+: rest of page
    const { phase, isVisible } = useStagedReveal(isReady, 8);

    const graphData = dataState.status === "loaded" && dataState.data.graph ? dataState.data.graph : null;
    const timelineData = dataState.status === "loaded" && dataState.data.projects ? dataState.data.projects : null;

    // WebMCP stuff
    const snapshotRef = useRef<WebMCPSnapshot>({ about: "", graph: null, projects: null });

    useEffect(() => {
        snapshotRef.current = {
            about: ABOUT_TEXT.join(" "),
            graph: graphData,
            projects: timelineData,
        };
    }, [graphData, timelineData]);

    useEffect(() => {
        if (import.meta.env.VITE_ENABLE_WEBMCP !== "true") {
            return;
        }

        return installWebMCP(() => snapshotRef.current);
    }, []);

    return (
        <div className={`relative transition-opacity duration-300 ${phase === "blank" ? "opacity-0" : "opacity-100"}`}>
            <Head />
            <Banner />
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
                        <DataErrorMessage message="An error occurred while loading activity data." onRetry={retry} />
                    )}
                </Container>

                <div className="max-w-[1200px] mx-auto px-8">
                    <SectionHeader text="projects" infoTooltip="Currently only has running 2 years of data" />
                    {timelineData ? (
                        <Timeline projects={timelineData} />
                    ) : (
                        <DataErrorMessage message="An error occurred while loading project data." onRetry={retry} />
                    )}
                </div>
            </main>
            <Footer />
            <ScrollToTop />
        </div>
    );
}
