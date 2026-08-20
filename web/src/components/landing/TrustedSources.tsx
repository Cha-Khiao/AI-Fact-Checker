"use client";

import React, { useState } from "react";
import { Fade } from "@/components/Fade";
import { Globe, ShieldCheck, Buildings } from "@phosphor-icons/react";

interface VerifiedEntity {
  name: string;
  domain: string;
  category: string;
}

const verifiedEntities: VerifiedEntity[] = [
  { name: "ศูนย์ต่อต้านข่าวปลอม (AFNC)", domain: "antifakenewscenter.com", category: "ศูนย์ตรวจสอบข่าวทางการ" },
  { name: "ชัวร์ก่อนแชร์ (MCOT)", domain: "mcot.net", category: "ศูนย์ตรวจสอบข้อเท็จจริง" },
  { name: "Cofact Thailand", domain: "cofact.org", category: "เครือข่ายตรวจสอบข้อเท็จจริง" },
  { name: "ไทยรัฐ (Thairath)", domain: "thairath.co.th", category: "สำนักข่าวและสื่อสิ่งพิมพ์" },
  { name: "Thai PBS (ไทยพีบีเอส)", domain: "thaipbs.or.th", category: "องค์การกระจายเสียงสาธารณะ" },
  { name: "มติชน (Matichon)", domain: "matichon.co.th", category: "สำนักข่าวและการเมือง" },
  { name: "ข่าวสด (Khaosod)", domain: "khaosod.co.th", category: "ข่าวออนไลน์และกระแสสังคม" },
  { name: "เดลินิวส์ (Dailynews)", domain: "dailynews.co.th", category: "สำนักข่าวรายวัน" },
  { name: "กรุงเทพธุรกิจ", domain: "bangkokbiznews.com", category: "ข่าวธุรกิจและการเงิน" },
  { name: "The Standard", domain: "thestandard.co", category: "สื่อสร้างสรรค์และดิจิทัล" },
  { name: "PPTV HD 36", domain: "pptvhd36.com", category: "สถานีโทรทัศน์ดิจิทัล" },
  { name: "TNN Thailand 16", domain: "tnnthailand.com", category: "สถานีข่าว 24 ชั่วโมง" },
  { name: "Workpoint Today", domain: "workpointtoday.com", category: "ข่าวและประเด็นสังคม" },
  { name: "BBC News (บีบีซี)", domain: "bbc.com", category: "สำนักข่าวสากล" },
  { name: "Reuters (รอยเตอร์)", domain: "reuters.com", category: "สำนักข่าวสากล" },
  { name: "Bloomberg", domain: "bloomberg.com", category: "ข่าวการเงินและตลาดโลก" },
  { name: "Associated Press (AP)", domain: "apnews.com", category: "สำนักข่าวสากล" },
  { name: "ธนาคารแห่งประเทศไทย (BOT)", domain: "bot.or.th", category: "สถาบันการเงินทางการ" },
  { name: "กรมอุตุนิยมวิทยา", domain: "tmd.go.th", category: "พยากรณ์อากาศและภัยพิบัติ" },
  { name: "อย. กระทรวงสาธารณสุข", domain: "fda.moph.go.th", category: "ยา เวชภัณฑ์ และสุขภาพ" },
  { name: "สำนักงานตำรวจแห่งชาติ", domain: "royalthaipolice.go.th", category: "งานป้องกันและปราบปราม" },
  { name: "สำนักงาน ก.ล.ต.", domain: "sec.or.th", category: "ตลาดทุนและการลงทุน" },
];

function BrandLogo({ domain, name, className = "h-7 w-7" }: { domain: string; name: string; className?: string }) {
  const [imgError, setImgError] = useState(false);
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

  if (imgError) {
    return (
      <div className={`flex shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-cyan-400 font-bold text-xs ${className}`}>
        {name.slice(0, 1)}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={faviconUrl}
      alt={name}
      loading="lazy"
      onError={() => setImgError(true)}
      className={`shrink-0 object-contain rounded-lg shadow-xs transition-all ${className}`}
    />
  );
}

function getRowPerspectiveStyle(idx: number) {
  if (idx === 0) {
    return {
      container: "py-3.5 sm:py-4 px-3 scale-100 sm:scale-[1.02] opacity-100 origin-top",
      logoSize: "h-9 w-9 p-0.5",
      titleSize: "text-base sm:text-lg font-black text-slate-950 dark:text-white tracking-tight",
      domainSize: "text-xs sm:text-sm font-mono font-bold text-blue-600 dark:text-cyan-300",
      categorySize: "text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200",
    };
  }
  if (idx === 1) {
    return {
      container: "py-3 sm:py-3.5 px-3 scale-[0.99] opacity-95 origin-top",
      logoSize: "h-8 w-8 p-0.5",
      titleSize: "text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100",
      domainSize: "text-xs font-mono font-semibold text-blue-600 dark:text-cyan-300",
      categorySize: "text-xs font-medium text-slate-600 dark:text-slate-300",
    };
  }
  if (idx === 2) {
    return {
      container: "py-2.5 px-3 scale-[0.97] opacity-90 origin-top",
      logoSize: "h-7 w-7 p-0.5",
      titleSize: "text-sm font-bold text-slate-900 dark:text-slate-200",
      domainSize: "text-xs font-mono font-medium text-blue-600/90 dark:text-cyan-300/90",
      categorySize: "text-xs font-medium text-slate-600 dark:text-slate-300",
    };
  }
  if (idx === 3) {
    return {
      container: "py-2 px-3 scale-[0.95] opacity-80 origin-top",
      logoSize: "h-6 w-6",
      titleSize: "text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-300",
      domainSize: "text-[11px] font-mono text-slate-500 dark:text-cyan-400/80",
      categorySize: "text-xs text-slate-500 dark:text-slate-400",
    };
  }
  if (idx === 4) {
    return {
      container: "py-1.5 px-3 scale-[0.93] opacity-65 origin-top",
      logoSize: "h-5 w-5",
      titleSize: "text-xs font-medium text-slate-700 dark:text-slate-400",
      domainSize: "text-[11px] font-mono text-slate-400 dark:text-slate-400",
      categorySize: "text-[11px] text-slate-500 dark:text-slate-400",
    };
  }
  if (idx === 5) {
    return {
      container: "py-1.5 px-3 scale-[0.90] opacity-45 origin-top",
      logoSize: "h-5 w-5",
      titleSize: "text-xs font-normal text-slate-600 dark:text-slate-500",
      domainSize: "text-[10px] font-mono text-slate-400 dark:text-slate-500",
      categorySize: "text-[11px] text-slate-400 dark:text-slate-500",
    };
  }
  return {
    container: "py-1 px-3 scale-[0.87] opacity-25 origin-top",
    logoSize: "h-4 w-4",
    titleSize: "text-[11px] font-normal text-slate-500 dark:text-slate-600",
    domainSize: "text-[10px] font-mono text-slate-400 dark:text-slate-600",
    categorySize: "text-[10px] text-slate-400 dark:text-slate-600",
  };
}

export default function TrustedSources() {
  return (
    <section id="sources" className="py-14 sm:py-20 overflow-hidden">
      <div className="wrapper">
        <Fade triggerOnce direction="up">
          <div className="mb-10 text-center max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              สำนักข่าวและหน่วยงานทางการที่ระบบใช้สืบค้น
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
              รายชื่อโดเมนสำนักข่าวและหน่วยงานทางการ (Whitelist) ที่ระบบใช้เป็นขอบเขตในการสืบค้นและเทียบเคียงข้อมูล
            </p>
          </div>
        </Fade>

        <Fade triggerOnce direction="up" delay={150}>
          <div className="relative max-w-4xl mx-auto">
            <div className="hidden sm:grid grid-cols-12 gap-4 pb-3 mb-2 border-b-2 border-slate-300 dark:border-[#2d4166] text-xs font-mono font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wider">
              <div className="col-span-6 flex items-center gap-2">
                <ShieldCheck size={16} weight="bold" className="text-blue-500" />
                <span>สำนักข่าว / หน่วยงานทางการ</span>
              </div>
              <div className="col-span-3 flex items-center gap-2">
                <Globe size={16} weight="bold" className="text-cyan-500" />
                <span>โดเมนหลัก (Domain)</span>
              </div>
              <div className="col-span-3 flex items-center gap-2">
                <Buildings size={16} weight="bold" className="text-indigo-500" />
                <span>หมวดหมู่ข้อมูล</span>
              </div>
            </div>

            <div
              className="max-h-[380px] overflow-hidden divide-y divide-slate-200/60 dark:divide-[#1f314d]/60"
              style={{
                maskImage: "linear-gradient(to bottom, black 35%, rgba(0,0,0,0.7) 65%, transparent 100%)",
                WebkitMaskImage: "linear-gradient(to bottom, black 35%, rgba(0,0,0,0.7) 65%, transparent 100%)",
              }}
            >
              {verifiedEntities.map((source, idx) => {
                const style = getRowPerspectiveStyle(idx);

                return (
                  <div
                    key={source.name + idx}
                    className={`grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-center transition-all duration-300 ${style.container}`}
                  >
                    <div className="sm:col-span-6 flex items-center gap-3 min-w-0">
                      <BrandLogo domain={source.domain} name={source.name} className={style.logoSize} />
                      <span className={`truncate ${style.titleSize}`}>
                        {source.name}
                      </span>
                    </div>

                    <div className="sm:col-span-3 flex items-center">
                      <span className={`truncate ${style.domainSize}`}>
                        {source.domain}
                      </span>
                    </div>

                    <div className="sm:col-span-3 flex items-center">
                      <span className={`truncate ${style.categorySize}`}>
                        {source.category}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </Fade>
      </div>
    </section>
  );
}
