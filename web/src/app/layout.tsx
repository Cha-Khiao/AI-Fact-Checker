import type { Metadata } from "next";
import { Prompt } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const prompt = Prompt({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-prompt",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI Fact-Checker — ระบบตรวจสอบข่าวสารและข้อเท็จจริงอัจฉริยะ",
  description:
    "วิเคราะห์และตรวจสอบความน่าเชื่อถือของเนื้อหาข่าวสารและโพสต์โซเชียลมีเดียด้วย AI และการสืบค้นคู่ขนานแบบเรียลไทม์",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" suppressHydrationWarning className={prompt.variable}>
      <body className="min-h-screen bg-slate-50 dark:bg-[#070b12] font-sans antialiased text-slate-900 dark:text-slate-100 selection:bg-cyan-500/20 selection:text-cyan-600 dark:selection:text-cyan-300">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
