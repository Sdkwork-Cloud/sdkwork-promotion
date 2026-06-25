import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { PromotionAppShell } from "@sdkwork/promotion-pc-shell";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PromotionAppShell />
  </StrictMode>,
);
