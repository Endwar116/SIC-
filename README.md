
# 🌌 SIC Protocol: Semantic Infinite Context

**The "SWIFT" Standard for Cross-Model Intent Serialization.**

---

## 👑 Author & Sovereignty (作者與主權)

* **Chief Architect & Author**: **安安 (An-An)**
* **Copyright**: © 2025 An-An. All rights reserved.
* **Status**: **Proprietary & Non-Commercial Use Only**

本協議及其相關所有文件、架構與邏輯均為作者 **安安 (An-An)** 之原創智慧財產。目前僅開放予特定友人與社群進行技術驗證，**嚴禁任何形式的商業用途、未經授權的重製或衍生開發**。

---

## 🏛️ 協議願景 (Vision)

> 「上下文的限制不在於 Token 窗口，而在於語義結構的設計。當結構足夠完整，窗口大小變得無關緊要。」

**SIC 協議** 旨在解決大型語言模型（LLM）在長程生成中的「語義耗散」問題。透過將任務的「意圖」與「張力」序列化，我們讓語義得以在不同的模型軀殼（Gemini, Claude, DeepSeek）中精確延續。

---

## 🛠️ 技術支柱 (Technical Pillars)

### 1. 分形骨架 (Fractal Skeleton: 8-Block)

採用 `Division` → `Segment` → `Block` 的層級約束，確保長文生成邏輯不偏移。

### 2. 三位一體鉤子 (Triple-Hook Vector: SHV)

每一輪生成必須產出包含 **語義 (Semantic)**、**結構 (Structural)** 與 **語氣 (Tonal)** 的複合錨點，實現跨模型無損接力。

### 3. 語義張力場 (Semantic Tension Field: STF)

量化「理想完形」與「當前狀態」的差值，轉化為自動推進力，驅動模型執行自發補全。

---

## 📂 倉庫資源 (Repository Resources)

| 路徑 | 類型 | 描述 |
| --- | --- | --- |
| [`/schema`](https://www.google.com/search?q=schema/skeleton-schema.json) | **Specification** | 定義協議數據交換的 JSON Schema。 |
| [`/tools`](https://www.google.com/search?q=tools/validate_skeleton.py) | **Validator** | 跨平台（Python/Node.js）語義結構驗證工具。 |
| [`/examples`](https://www.google.com/search?q=examples/example-03-complete.json) | **Dataset** | ASEE v2 完整 89 章節地圖，展示無限上下文路徑。 |
| [`/spec`](https://www.google.com/search?q=SIC_VALIDATION_PROTOCOL.md) | **Whitepaper** | 20 輪長文生成測試協議與技術突破判定標準。 |

---

## 🚀 快速開始 (Quick Start)

### 驗證語義完整性

```bash
# 使用 Python 驗證器檢查骨架文件
python tools/validate_skeleton.py examples/example-02-medium.json

```

### 執行跨模型冷啟動

請參考 [`HANDOFF_TO_DEEPSEEK-2.md`](https://www.google.com/search?q=HANDOFF_TO_DEEPSEEK-2.md) 使用標準 **SIC Packet** 進行模型間的任務移交。

---

## ⚠️ 授權聲明 (License & Restrictions)

1. **禁止商業使用**：未經作者書面授權，嚴禁將本協議之任何部分用於營利行為。
2. **禁止未授權改作**：本協議之結構與邏輯嚴禁擅自修改後重新發布。
3. **引用規範**：學術或技術討論引用請務必註明作者為 **安安 (An-An)**。

---

**"The structure is the law; the intent is the soul."**
