import { useState } from "react";
import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { SectionDemo } from "./components/SectionDemo";
import { Pricing } from "./components/Pricing";
import { Footer } from "./components/Footer";
import { LoginModal } from "./components/LoginModal";
import { DemoDashboard } from "./demos/DemoDashboard";
import { DemoMedia } from "./demos/DemoMedia";
import { DemoSlideshow } from "./demos/DemoSlideshow";
import { DemoAccounts } from "./demos/DemoAccounts";
import { useTranslation } from "react-i18next";
import { MEDIA_POOL, INITIAL_MEDIA_IDS, type DemoMediaItem } from "./demos/demo-data";

export function App() {
  const { t } = useTranslation();

  const [loginOpen, setLoginOpen] = useState(false);
  const [mediaItems, setMediaItems] = useState<DemoMediaItem[]>(
    MEDIA_POOL.filter((m) => INITIAL_MEDIA_IDS.includes(m.id))
  );

  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased">
      <Navbar onLoginClick={() => setLoginOpen(true)} />
      <Hero />

      <div id="product" className="space-y-0">
        <SectionDemo
          title={t("sections.dashboard")}
          description={t("sections.dashboardDesc")}
          align="left"
        >
          <DemoDashboard />
        </SectionDemo>

        <SectionDemo
          title={t("sections.media")}
          description={t("sections.mediaDesc")}
          align="right"
          alt
        >
          <DemoMedia items={mediaItems} onChange={setMediaItems} />
        </SectionDemo>

        <SectionDemo
          title={t("sections.slideshow")}
          description={t("sections.slideshowDesc")}
          align="left"
        >
          <DemoSlideshow items={mediaItems} />
        </SectionDemo>

        <SectionDemo
          title={t("sections.accounts")}
          description={t("sections.accountsDesc")}
          align="right"
          alt
        >
          <DemoAccounts />
        </SectionDemo>
      </div>

      <Pricing />
      <Footer />
      {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} />}
    </div>
  );
}
