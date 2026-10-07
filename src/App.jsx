import { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Philosophy from "./components/Philosophy";
import Services from "./components/Services";
import Gallery from "./components/Gallery";
import Ritual from "./components/Ritual";
import Journal from "./components/Journal";
import Reviews from "./components/Reviews";
import Booking from "./components/Booking";
import Footer from "./components/Footer";
import RevealObserver from "./components/RevealObserver";
import Admin from "./components/Admin";
import { LanguageProvider } from "./context/LanguageContext";

function AppContent() {
  const [scrolled, setScrolled] = useState(false);
  const [requestedService, setRequestedService] = useState(
    () => new URLSearchParams(window.location.search).get("service") || ""
  );
  const currentPath = window.location.pathname.replace(/\/+$/, "") || "/";
  const isBookingPage = currentPath === "/booking";
  const isAdminPage = currentPath === "/admin";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (isAdminPage) return undefined;
    const sectionId = window.location.hash.slice(1)
      || (currentPath === "/treatments" ? "treatments" : "");

    if (!sectionId || isBookingPage) return undefined;
    if (currentPath === "/treatments") {
      window.history.replaceState(null, "", `/#${sectionId}`);
    }

    const frame = window.requestAnimationFrame(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [currentPath, isBookingPage, isAdminPage]);

  if (isAdminPage) return <Admin />;

  return (
    <div className="site-shell">
      <RevealObserver />
      <Navbar compact={scrolled} />
      <main>
        {isBookingPage ? (
          <Booking selectedService={requestedService} onServiceChange={setRequestedService} />
        ) : (
          <>
            <Hero />
            <Philosophy />
            <Services />
            <Gallery />
            <Ritual />
            <Journal />
            <Reviews />
            <Booking selectedService={requestedService} onServiceChange={setRequestedService} />
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}