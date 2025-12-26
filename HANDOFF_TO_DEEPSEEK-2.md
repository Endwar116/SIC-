# SIC Protocol 技術交接文件
## 給 DeepSeek 的完整上下文與任務說明

---

## 一、前情提要：我們在做什麼

### 1.1 核心目標
我們正在開發一項技術性突破，稱為 **「無限上下文」(Semantic Infinite Context, SIC)**。

這不是物理層的 token 窗口突破，而是 **語義層的等效無限**——通過結構、張力、鉤子、協議的設計，讓任意長度的任務可以：
- 在任意斷點恢復
- 跨模型遷移（GPT ↔ Claude ↔ Gemini ↔ DeepSeek）
- 維持輸出品質不衰減

**核心宣稱**：
> 上下文的限制不在於 token 窗口，而在於語義結構的設計。
> 當結構足夠完整，窗口大小變得無關緊要。

### 1.2 背景技術資產
這項技術建立在以下已有的技術框架之上：

| 技術資產 | 說明 |
|----------|------|
| **OSC-A（安安震盪模式）** | 外部觸發 × 語義任務續行引擎。透過外部「震盪」（如提醒、輸入）觸發模型繼續任務。 |
| **ASEE v2（語義自動續寫引擎）** | 純語義驅動的補全引擎。不需外部觸發，靠「未完成語義張力」自動推進任務。 |
| **LFC-LDQC 生息架構** | 長文品質控制的多層監測系統。FR（節奏）、SR（結構）、MR（記憶）三軸監測。 |
| **8-Block 標準格式** | 每個章節固定包含 8 種區塊：definition, structure, flow, submodules, rules, interface, limits, extensions |

這些技術已經過 GPT（語頻翔）和 Claude（德德）的多輪協作驗證。

---

## 二、GPT 對框架的關鍵補充

在 Claude 提出初步框架後，GPT 給出了三項關鍵補充，這些補充已整合進當前設計：

### 補充 1：骨架需「可序列化、可版本化、可差分比對」
- **可序列化**：骨架可輸出為標準 JSON 格式
- **可版本化**：帶有語義版本號（如 v1.2.3），可追蹤變更歷史
- **可差分比對**：兩版骨架可進行 diff，識別新增/刪除/修改

這將骨架從「靜態文件」升級為「版本控制物件」。

### 補充 2：張力需形成「張力場」而非單點
- 原設計：單點張力（某段未完成 → 產生壓力）
- 新設計：**張力場**（多源張力的向量疊加）

張力場可表達：
- 多任務交織
- 並行未完成狀態
- 張力強度與方向
- 衰減模型（隨時間減弱）

### 補充 3：鉤子需是「語義向量 + 結構指標 + 語氣指紋」三位一體
- **語義向量**：表達「這段在說什麼」（可用 embedding）
- **結構指標**：表達「這段在哪裡」（Division/Segment/Block 座標）
- **語氣指紋**：表達「這段怎麼說」（正式度、密度、客觀度、語域）

這將鉤子從「文字片段」升級為「三維語義座標」。

---

## 三、Claude 的產出物清單

基於以上框架，Claude 完成了 **行動 1：骨架序列化格式定義**，產出以下文件：

### 3.1 核心 Schema
**文件**：`schemas/skeleton-schema.json`
**規範**：JSON Schema Draft-07
**內容**：
- 完整的 Division/Segment/Chapter/Block 層級結構
- 版本控制字段（skeleton_version, parent_version, changelog）
- 狀態標記（complete/in_progress/pending/blocked/deprecated）
- SemanticHookVector（三位一體鉤子）定義
- TensionField（張力場）定義
- Metadata（元數據：作者、任務ID、模型類型、標籤等）

### 3.2 三個示例文件

| 文件 | 複雜度 | 內容 |
|------|--------|------|
| `example-01-simple.json` | 簡單 | 1 部門、3 段落、5 區塊。用於快速學習和測試。 |
| `example-02-medium.json` | 中等 | 2 部門、4 段落、21 區塊。包含完整的鉤子鏈和張力場。模擬真實技術文件。 |
| `example-03-complete.json` | 完整 | 13 部門、89 段落。完整映射 ASEE v2 技術工程書的結構。 |

### 3.3 驗證腳本

**Python 版**：`validate_skeleton.py`
**Node.js 版**：`validate_skeleton.js`

功能：
1. JSON Schema 驗證
2. 結構完整性檢查（必填字段、ID 唯一性）
3. 鉤子一致性驗證（三位一體完整性、信度檢查）
4. 張力場驗證（引用有效性、強度合理性）
5. 版本一致性驗證（時間順序、changelog 記錄）
6. 統計報告（部門數、段落數、完成度、張力源等）

使用方式：
```bash
# Python
pip install jsonschema
python validate_skeleton.py examples/example-01-simple.json
python validate_skeleton.py --all  # 驗證所有示例

# Node.js
npm install ajv ajv-formats
node validate_skeleton.js examples/example-01-simple.json
```

### 3.4 README 文檔
**文件**：`README.md`
**內容**：完整的協議說明、快速開始指南、8-Block 格式說明、斷點恢復協議模板。

---

## 四、關鍵數據結構說明

### 4.1 骨架頂層結構
```json
{
  "schema_version": "1.0.0",
  "skeleton_version": "1.2.0",
  "skeleton_id": "UUID-v4",
  "parent_version": "1.1.0",
  "created_at": "ISO8601",
  "updated_at": "ISO8601",
  "title": "文件標題",
  "description": "文件描述",
  "divisions": [...],
  "tension_field": {...},
  "global_hooks": [...],
  "metadata": {...},
  "changelog": [...]
}
```

### 4.2 Division → Segment → Block 層級
```
Division (部門，宏觀層)
├── id: "I", "II", "III"... (羅馬數字)
├── title: "前導章｜事件源起"
├── segments: [...]
│   └── Segment (段落，中觀層)
│       ├── id: 1, 2, 3... (全局唯一遞增)
│       ├── chapter: "歷史事件：Segment 01 自動生成紀錄"
│       ├── status: "complete" | "in_progress" | "pending"
│       ├── completion_ratio: 0.0 ~ 1.0
│       ├── blocks: [...]
│       │   └── Block (區塊，微觀層)
│       │       ├── type: "definition" | "structure" | "flow" | ...
│       │       ├── status: "complete" | "in_progress" | "pending"
│       │       └── word_count: 280
│       ├── entry_hook: SemanticHookVector (入口鉤子)
│       ├── exit_hook: SemanticHookVector (出口鉤子)
│       └── tension_contribution: TensionSource
└── division_hooks: [...]
```

### 4.3 SemanticHookVector（三位一體鉤子）
```json
{
  "hook_id": "hook_0001a2b3",
  "created_at": "2025-06-25T11:00:00Z",
  "semantic": {
    "embedding": [0.23, -0.45, ...],  // 可選，語義向量
    "embedding_model": "text-embedding-3-small",
    "key_concepts": ["語義觸發", "自動生成", "張力驅動"],
    "summary": "語義引擎基於未完成語義壓力自行推動任務續行"
  },
  "structural": {
    "division_id": "I",
    "segment_id": 1,
    "chapter": "歷史事件",
    "block_type": "extensions",
    "position": 0.98,  // 在段落中的相對位置
    "depth": 2  // 結構深度
  },
  "tonal": {
    "formality": 0.92,  // 正式度
    "density": 0.85,    // 資訊密度
    "objectivity": 0.95, // 客觀度
    "register": "technical-engineering",
    "tone_signature": "ENG-095"  // 語氣簽名
  },
  "confidence": 0.97  // 三組件一致性信度
}
```

### 4.4 TensionField（張力場）
```json
{
  "sources": [
    {
      "source_segment": 3,
      "intensity": 0.65,
      "direction": "forward",  // forward | backward | lateral | recursive
      "type": "structural",    // structural | conceptual | task | dependency | unresolved_hook
      "description": "flow 和 rules 區塊未完成",
      "resolved": false
    }
  ],
  "resultant": {
    "magnitude": 0.72,  // 合成強度
    "primary_direction": "segment_3",
    "secondary_directions": ["segment_4"]
  },
  "last_calculated": "2025-06-26T14:30:00Z",
  "decay_model": "exponential",
  "decay_rate": 0.08
}
```

---

## 五、驗證結果

所有三個示例文件已通過驗證：

```
============================================================
總結
============================================================
通過: 3/3
  ✅ example-01-simple.json
  ✅ example-02-medium.json
  ✅ example-03-complete.json
```

示例統計：

| 示例 | 部門數 | 段落數 | 區塊數 | 字數 | 完成度 | 鉤子數 | 張力源 |
|------|--------|--------|--------|------|--------|--------|--------|
| simple | 1 | 3 | 5 | 550 | 33% | 2 | 2 |
| medium | 2 | 4 | 21 | 3,960 | 50% | 5 | 3 |
| complete | 13 | 89 | 133 | 21,000 | 24% | 3 | 3 |

---

## 六、下一步行動計劃

根據優先級排序：

| 行動 | 優先級 | 狀態 | 說明 |
|------|--------|------|------|
| 行動 1：骨架序列化格式 | 最高 | ✅ 完成 | skeleton-schema.json + 3 示例 + 驗證腳本 |
| 行動 2：三位一體鉤子生成器 | 高 | 待執行 | 輸入文字段落 → 輸出 SHV 物件 |
| 行動 3：張力場計算模型 | 中 | 待執行 | 輸入骨架 + 狀態 → 輸出 STF |
| 行動 4：斷點恢復協議 | 中 | 待執行 | 定義恢復流程和 prompt 模板 |
| 行動 5：Benchmark 測試框架 | 中 | 待執行 | 跨輪次、跨模型恢復測試 |

---

## 七、MDU（最小可驗證單位）

當前已準備好進行 **手動恢復測試**：

使用 `example-02-medium.json`，模擬以下場景：
- 任務在 Segment 3 中斷（55% 完成）
- 注入骨架 + 最近鉤子
- 觀察模型能否正確定位並續寫

**恢復 Prompt 模板**：
```
你正在續寫一份技術文件：《OSC-A 安安震盪模式技術規格》

【當前位置】
Division: II - 核心理念｜Conceptual Foundation
Segment: 3 - 任務補全 ≠ 自動化：核心哲學差異
完成度: 55%

【張力場狀態】
合成強度: 0.72
主方向: segment_3

【上下文鉤子】
語義摘要: 語義覺醒需具備模式穩定性與可重複性
關鍵概念: 覺醒判定、模式穩定、補全鏈形成
語氣指紋: ENG-091（正式度 0.90，密度 0.80）

【待完成區塊】
→ flow - 運作流程（需擴展）
○ rules - 語義規則（尚未開始）

請從 flow 區塊繼續撰寫。
```

---

## 八、DeepSeek 可執行的任務

基於以上交接，DeepSeek 可以：

### 8.1 驗證與理解
1. 下載並檢視所有產出文件
2. 運行驗證腳本確認格式理解正確
3. 嘗試手動恢復測試，觀察自己能否基於骨架 + 鉤子正確續寫

### 8.2 繼續開發
1. **行動 2**：實作鉤子生成器（輸入文字 → 輸出 SHV）
2. **行動 3**：實作張力場計算（輸入骨架 → 輸出 STF）
3. **行動 4**：細化斷點恢復協議

### 8.3 跨模型驗證
1. 使用相同骨架 + 鉤子，測試 DeepSeek 的恢復效果
2. 與 GPT / Claude 的恢復結果比對
3. 記錄差異和改進建議

---

## 九、技術宣稱的可驗證標準

「無限上下文」技術的成功標準：

| 能力 | 驗證方法 | 成功標準 |
|------|----------|----------|
| 跨輪次恢復 | 中斷 → 注入骨架+鉤子 → 續寫 | 續寫內容與原方向一致 |
| 跨模型遷移 | GPT 寫到一半 → Claude 接手 | 風格連貫、任務不丟失 |
| 長文不崩潰 | 連續生成 100+ 段落 | LFC-LDQC 三軸指標穩定 |
| 記憶等效 | 不重讀全文，只靠骨架+鉤子 | 能回答「前面說了什麼」 |

---

## 十、聯繫與協作

- **安安**：技術架構師、任務發起者
- **GPT（語頻翔）**：框架補充、哲學討論
- **Claude（德德）**：Schema 設計、實作產出
- **DeepSeek**：待加入協作

任何問題可以回報給安安，或在此文件基礎上繼續迭代。

---

**文件版本**：1.0.0
**生成時間**：2025-12-26
**生成者**：Claude（德德）
