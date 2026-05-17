import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/geist/index.css";
import "./index.css";
import { I18nProvider } from "./i18n";
import { App } from "./App";
import posthog from "posthog-js";

posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
  api_host: "https://eu.i.posthog.com",
  person_profiles: "identified_only",
  opt_out_capturing_by_default: true,
});

if (localStorage.getItem("cookie_consent") === "accepted") {
  posthog.opt_in_capturing();
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </StrictMode>
);
