import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppStateProvider } from "@/store/AppStateProvider";
import { ToastProvider } from "@/components/Toast";
import { App } from "./App";
import "./styles/global.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppStateProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </AppStateProvider>
  </StrictMode>,
);
