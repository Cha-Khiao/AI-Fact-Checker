import modal
import os
import json
import time

# 1. ⚙️ สร้าง Modal App
app = modal.App("factchecker-9models-parallel-benchmark")

# 2. 🐧 Image Linux บน Cloud (ติดตั้ง zstd, Ollama, และไลบรารีวิเคราะห์)
image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("curl", "zstd")
    .run_commands("curl -fsSL https://ollama.com/install.sh | sh")
    .pip_install("pandas", "numpy", "matplotlib", "seaborn", "scikit-learn", "tqdm", "requests")
)

# 3. 🎯 ฟังก์ชันทดสอบ 1 โมเดล x 200 ข้อ (รันขนานพร้อมกันได้หลาย GPU บน Cloud)
@app.function(
    image=image,
    gpu="A100-80GB",
    timeout=900,  # 15 นาทีต่อโมเดล (เหลือๆ สบายมาก)
)
def evaluate_single_model_remote(payload: dict) -> dict:
    import subprocess, time, requests, json, re
    import pandas as pd
    from tqdm import tqdm

    cfg = payload["config"]
    dataset = payload["dataset"]
    m_name = cfg["name"]
    m_tag = cfg["tag"]
    tier = cfg["tier"]

    # เริ่มต้น Ollama Server
    subprocess.Popen(["ollama", "serve"])
    time.sleep(4)

    print(f"📥 [GPU A100] กำลังดาวน์โหลด {m_name} ({m_tag})...")
    subprocess.run(["ollama", "pull", m_tag], capture_output=True)

    PROMPT_TEMPLATE = """คุณคือผู้เชี่ยวชาญการตรวจสอบข้อเท็จจริง (AI Fact-Checker) กรุณาวิเคราะห์ข้อความข่าวต่อไปนี้ว่าเป็น 'ข่าวจริง' หรือ 'ข่าวปลอม/บิดเบือน':

[ข้อความข่าวที่ต้องการตรวจ]:
{news_text}

เกณฑ์การให้คะแนน (score 1-5):
- 5: ข่าวจริง สอดคล้องสมบูรณ์
- 4: ข่าวจริงเป็นส่วนใหญ่
- 3: ข้อมูลก้ำกึ่ง / รอการยืนยัน
- 2: ข้อมูลบิดเบือน / คลาดเคลื่อน
- 1: ข่าวปลอม / ข้อมูลเท็จโดยสิ้นเชิง

ตอบกลับเป็น JSON รูปแบบนี้เท่านั้น:
{{
    "verdict": "Real หรือ Fake",
    "score": 1 ถึง 5,
    "summary": "สรุปข้อเท็จจริงสั้นๆ 1 ประโยค",
    "reasoning": "เหตุผลวิเคราะห์สั้นๆ"
}}"""

    df_dataset = pd.DataFrame(dataset)
    y_true, y_pred, latencies, valid_jsons = [], [], [], []
    detailed_rows = []

    print(f"🚀 [GPU A100] เริ่มทดสอบ {m_name} ครบ {len(df_dataset)} ข้อ...")
    for idx, row in df_dataset.iterrows():
        gt = row["ground_truth"]
        news_txt = row["suspect_news"]

        st = time.time()
        try:
            res = requests.post(
                "http://localhost:11434/api/generate",
                json={
                    "model": m_tag,
                    "prompt": PROMPT_TEMPLATE.format(news_text=news_txt),
                    "format": "json",
                    "stream": False,
                    "options": {"temperature": 0.0, "num_predict": 180} # ปรับให้ตอบกระชับ ไวขึ้น 3 เท่า
                },
                timeout=60
            )
            raw_text = res.json().get("response", "")
            raw_text = re.sub(r'<think>[\s\S]*?</think>', '', raw_text).strip()
            match = re.search(r'\{[\s\S]*\}', raw_text)
            parsed = json.loads(match.group() if match else raw_text)

            raw_v = str(parsed.get("verdict", "")).strip().lower()
            score = int(parsed.get("score", 3))

            if "fake" in raw_v or "ปลอม" in raw_v or "บิดเบือน" in raw_v or "เท็จ" in raw_v:
                verdict = "Fake"
            elif "real" in raw_v or "จริง" in raw_v:
                verdict = "Real"
            else:
                verdict = "Real" if score >= 4 else "Fake"

            summary = parsed.get("summary", "")
            reasoning = parsed.get("reasoning", "")
            v_json = True
        except Exception:
            verdict, score, v_json, summary, reasoning = "Fake", 1, False, "Parse Failed", "Parse Failed"

        elapsed = time.time() - st
        y_true.append(gt)
        y_pred.append(verdict)
        latencies.append(elapsed)
        valid_jsons.append(1 if v_json else 0)

        detailed_rows.append({
            "ID": row.get("id", idx + 1),
            "ข้อความข่าว": news_txt,
            "เฉลยจริง": "ข่าวจริง" if gt == "Real" else "ข่าวปลอม",
            "โมเดลทำนาย": "ข่าวจริง" if verdict == "Real" else "ข่าวปลอม",
            "คะแนน (1-5)": score,
            "ผลการทำนาย": "ถูกต้อง ✅" if verdict == gt else "ผิดพลาด ❌",
            "เหตุผลที่โมเดลให้": reasoning,
            "สรุปข้อเท็จจริง": summary,
            "เวลาที่ใช้ (s)": round(elapsed, 2)
        })

    # คำนวณสถิติ
    tp = sum(1 for yt, yp in zip(y_true, y_pred) if yt == "Fake" and yp == "Fake")
    tn = sum(1 for yt, yp in zip(y_true, y_pred) if yt == "Real" and yp == "Real")
    fp = sum(1 for yt, yp in zip(y_true, y_pred) if yt == "Real" and yp == "Fake")
    fn = sum(1 for yt, yp in zip(y_true, y_pred) if yt == "Fake" and yp == "Real")

    total = len(y_true)
    acc = ((tp + tn) / total) * 100 if total > 0 else 0
    prec = (tp / (tp + fp) * 100) if (tp + fp) > 0 else 0
    rec = (tp / (tp + fn) * 100) if (tp + fn) > 0 else 0
    f1 = (2 * prec * rec / (prec + rec)) if (prec + rec) > 0 else 0
    json_rate = (sum(valid_jsons) / len(valid_jsons)) * 100
    avg_lat = sum(latencies) / len(latencies)
    composite = (acc * 0.40) + (f1 * 0.25) + (json_rate * 0.20) + (max(0, 100 - avg_lat * 10) * 0.15)

    print(f"🎉 [GPU A100] {m_name} เสร็จสิ้น: Accuracy={acc:.1f}%, F1={f1:.1f}%, Time={avg_lat:.2f}s")
    subprocess.run(["ollama", "rm", m_tag], capture_output=True)

    df_single = pd.DataFrame(detailed_rows)
    return {
        "model_name": m_name,
        "tier": tier,
        "tag": m_tag,
        "accuracy": round(acc, 2),
        "precision": round(prec, 2),
        "recall": round(rec, 2),
        "f1": round(f1, 2),
        "json_valid": round(json_rate, 2),
        "avg_latency": round(avg_lat, 2),
        "composite_score": round(composite, 2),
        "detailed_csv": df_single.to_csv(index=False, encoding="utf-8-sig"),
        "predictions": [f"{r['โมเดลทำนาย']} {r['ผลการทำนาย']}" for r in detailed_rows]
    }

# 4. 💻 รันบนเครื่องของคุณ: สั่งยิงขนาน 9 GPU พร้อมกัน และรวมไฟล์ผลลัพธ์
@app.local_entrypoint()
def main():
    import pandas as pd
    import matplotlib.pyplot as plt
    import seaborn as sns
    import io

    print("==================================================================")
    print("🚀 [Modal Labs] กำลังสั่งรันขนาน 9 โมเดลพร้อมกันบน Cloud A100...")
    print("⚡ แต่ละโมเดลจะประมวลผลพร้อมกัน จบครบ 200 ข่าวในเวลา ~5-7 นาที!")
    print("==================================================================")

    if not os.path.exists("afnc_200_dataset.json"):
        print("❌ ไม่พบไฟล์ afnc_200_dataset.json")
        return

    with open("afnc_200_dataset.json", "r", encoding="utf-8") as f:
        dataset = json.load(f)

    MODELS_CONFIG = [
        # Tier 1: 7B - 8B
        {"name": "Llama-3.1-8B", "tag": "llama3.1:8b", "tier": "8B"},
        {"name": "Qwen-2.5-7B", "tag": "qwen2.5:7b", "tier": "8B"},
        {"name": "DeepSeek-R1-8B", "tag": "deepseek-r1:8b", "tier": "8B"},
        
        # Tier 2: 27B - 32B
        {"name": "Gemma-2-27B", "tag": "gemma2:27b", "tier": "30B"},
        {"name": "Qwen-2.5-32B", "tag": "qwen2.5:32b", "tier": "30B"},
        {"name": "DeepSeek-R1-32B", "tag": "deepseek-r1:32b", "tier": "30B"},
        
        # Tier 3: 67B - 72B
        {"name": "Llama-3.3-70B", "tag": "llama3.3:70b", "tier": "70B"},
        {"name": "Qwen-2.5-72B", "tag": "qwen2.5:72b", "tier": "70B"},
        {"name": "DeepSeek-R1-70B", "tag": "deepseek-r1:70b", "tier": "70B"},
    ]

    # เตรียม payload สำหรับยิงขนาน 9 GPU
    payloads = [{"config": cfg, "dataset": dataset} for cfg in MODELS_CONFIG]

    # สั่งประมวลผลพร้อมกัน 9 GPU (Parallel Map)
    start_total = time.time()
    results = list(evaluate_single_model_remote.map(payloads))
    total_time = time.time() - start_total

    print(f"\n🎉 ทั้ง 9 โมเดลประมวลผลเสร็จสิ้นพร้อมกันในเวลา: {total_time/60:.2f} นาที!")

    # 1. บันทึกผลลัพธ์รายโมเดลลงเครื่อง
    summary_rows = []
    df_master = pd.DataFrame(dataset)
    df_master["เฉลย (Ground Truth)"] = df_master["ground_truth"].map({"Real": "ข่าวจริง ✅", "Fake": "ข่าวปลอม ❌"})

    for res in results:
        m_name = res["model_name"]
        filename = f"detailed_results_{m_name.replace('.', '_')}.csv"
        with open(filename, "w", encoding="utf-8-sig") as f:
            f.write(res["detailed_csv"])
        print(f"  💾 บันทึก: {filename}")

        df_master[f"{m_name} (ทำนาย)"] = res["predictions"]

        summary_rows.append({
            "Model": m_name,
            "Tag": res["tag"],
            "Tier": res["tier"],
            "Accuracy (%)": res["accuracy"],
            "Precision (%)": res["precision"],
            "Recall (%)": res["recall"],
            "F1-Score (%)": res["f1"],
            "JSON Valid (%)": res["json_valid"],
            "Avg Latency (s)": res["avg_latency"],
            "Composite Score": res["composite_score"]
        })

    # 2. บันทึกตารางแม่บทเปรียบเทียบ 200 ข้อ
    df_master.to_csv("all_models_200_comparison.csv", index=False, encoding="utf-8-sig")
    print("  💾 บันทึก: all_models_200_comparison.csv (ตารางเทียบ 9 โมเดล ครบ 200 ข้อ)")

    # 3. บันทึกตารางสรุปคะแนน Leaderboard
    df_summary = pd.DataFrame(summary_rows).sort_values(by="Composite Score", ascending=False).reset_index(drop=True)
    df_summary.index = df_summary.index + 1
    df_summary.to_csv("benchmark_9_models_leaderboard.csv", index=True, encoding="utf-8-sig")
    print("  💾 บันทึก: benchmark_9_models_leaderboard.csv (ตารางสรุปคะแนน)")

    print("\n🏆 ตารางคะแนนรวม 9 โมเดล (Leaderboard):")
    print(df_summary[["Model", "Tier", "Accuracy (%)", "F1-Score (%)", "Avg Latency (s)", "Composite Score"]].to_string())

    # 4. วาดและบันทึกภาพกราฟ 300 DPI
    sns.set_theme(style="whitegrid")
    
    # กราฟที่ 1: Bar Chart
    plt.figure(figsize=(11, 5), dpi=300)
    palette = {"8B": "#60a5fa", "30B": "#818cf8", "70B": "#3b82f6"}
    ax = sns.barplot(data=df_summary, x="Model", y="Accuracy (%)", hue="Tier", dodge=False, palette=palette)
    plt.title("Fact-Checking Accuracy across Model Sizes on 200 News (8B vs 30B vs 70B)", fontsize=13, fontweight="bold")
    plt.xticks(rotation=25, ha="right")
    plt.ylim(30, 105)
    for p in ax.patches:
        if p.get_height() > 0:
            ax.annotate(f"{p.get_height():.1f}%", (p.get_x() + p.get_width() / 2., p.get_height() + 1), ha='center', va='bottom', fontsize=9, fontweight='bold')
    plt.tight_layout()
    plt.savefig("chart_tier_accuracy_comparison.png")
    plt.close()
    print("  📊 บันทึก: chart_tier_accuracy_comparison.png")

    # กราฟที่ 2: Pareto Frontier
    plt.figure(figsize=(10, 6), dpi=300)
    sns.scatterplot(data=df_summary, x="Avg Latency (s)", y="F1-Score (%)", hue="Tier", size="Composite Score", sizes=(100, 300), palette=palette)
    for i, row in df_summary.iterrows():
        plt.text(row["Avg Latency (s)"] + 0.05, row["F1-Score (%)"] + 0.3, row["Model"], fontsize=9, fontweight='bold')
    plt.title("Pareto Frontier: Inference Speed vs. Fact-Checking F1-Score (200 News)", fontsize=14, fontweight="bold", pad=15)
    plt.xlabel("Average Latency (Seconds per Item) - Lower is Faster", fontsize=12)
    plt.ylabel("F1-Score (%) - Higher is Better", fontsize=12)
    plt.tight_layout()
    plt.savefig("chart_pareto_frontier.png")
    plt.close()
    print("  ⚖️ บันทึก: chart_pareto_frontier.png")

    print("\n🎉 ทุกอย่างเสร็จสมบูรณ์ 100%! คุณได้ไฟล์รายงานและกราฟครบถ้วนพร้อมนำไปใส่ในสไลด์และเล่มวิจัยแล้วครับ!")
