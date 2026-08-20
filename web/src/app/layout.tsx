import type { Metadata } from "next";
import { Prompt, Sarabun } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const prompt = Prompt({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-prompt",
  display: "swap",
});

const sarabun = Sarabun({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-sarabun",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI Fact-Checker",
  description:
    "วิเคราะห์และตรวจสอบความน่าเชื่อถือของเนื้อหาข่าวสารและโพสต์โซเชียลมีเดียด้วย AI และการสืบค้นคู่ขนานแบบเรียลไทม์",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" suppressHydrationWarning className={`${sarabun.variable} ${prompt.variable}`}>
      <body className="min-h-screen bg-[#f8fafc] dark:bg-[#070b12] antialiased text-slate-900 dark:text-slate-100 selection:bg-cyan-500/20 selection:text-cyan-600 dark:selection:text-cyan-300 font-normal">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
