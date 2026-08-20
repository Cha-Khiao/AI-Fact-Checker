"use client";

import { ThemeProvider } from "next-themes";
import { ReactNode, useEffect } from "react";

function WatermarkLogger() {
  useEffect(() => {
    console.log(
      "%c🛡️ AI FACT-CHECKER%c\n" +
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
        "🎓 Senior Capstone Project • 2569 (2026)\n" +
        "🏛️ Department of Computer Science, Sisaket Rajabhat University\n" +
        "⚡ Stateless Real-time Multi-Agent RAG Engine\n" +
        "© 2026 Sisaket Rajabhat University. All rights reserved.\n" +
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
      "color: #06b6d4; font-size: 18px; font-weight: 900; text-shadow: 0 0 8px rgba(6,182,212,0.4);",
      "color: #64748b; font-size: 11px; font-family: monospace; line-height: 1.5;"
    );
  }, []);

  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <WatermarkLogger />
      {children}
    </ThemeProvider>
  );
}


