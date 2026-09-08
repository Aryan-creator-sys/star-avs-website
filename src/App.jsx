import useSmoothScroll from "./lib/useSmoothScroll";
import ScrollProgress from "./components/ScrollProgress";
import CustomCursor from "./components/CustomCursor";
import HelpButton from "./components/HelpButton";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import About from "./components/About";
import Values from "./components/Values";
import Brands from "./components/Brands";
import Testimonials from "./components/Testimonials";
import ProjectsGallery from "./components/projects/ProjectsGallery";
import DriftWallSection from "./components/projects/DriftWallSection";
import Contact from "./components/Contact";
import Footer from "./components/Footer";

export default function App() {
  useSmoothScroll();
  return (
    <div className="relative overflow-x-clip bg-[#f6f6f4]">
      <CustomCursor />
      <ScrollProgress />
      <Navbar />
      <main>
        <Hero />               {/* new reactive hero (MagicRings + ParticleText + glass) */}
        <About />
        <Brands />
        <Values />
        <Testimonials />                             {/* reviews */}
        <ProjectsGallery />                          {/* fan carousel — top 12 home theatre */}
        <DriftWallSection />                         {/* drift wall — many other projects, above contact */}
        <Contact />
      </main>
      <Footer />
      {/* Floating Help button — expands to WhatsApp + Call (no chatbot) */}
      <HelpButton />
    </div>
  );
}
