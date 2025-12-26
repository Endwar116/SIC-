# Semantic Infinite Context (SIC) Protocol v1.0

**語義無限上下文協議**

一種不依賴模型原生窗口長度的上下文延續技術。

---

## 核心宣稱

> 上下文的限制不在於 token 窗口，而在於語義結構的設計。
> 當結構足夠完整，窗口大小變得無關緊要。

---

## 目錄結構

```
sic-protocol/
├── schemas/
│   └── skeleton-schema.json    # JSON Schema 規範 (Draft-07)
├── examples/
│   ├── example-01-simple.json   # 簡單示例（3 段落）
│   ├── example-02-medium.json   # 中等示例（4 段落，含完整鉤子）
│   └── example-03-complete.json # 完整示例（89 章節，13 部門）
├── validate_skeleton.py         # Python 驗證腳本
├── validate_skeleton.js         # Node.js 驗證腳本
└── README.md                    # 本文件
```

---

## 核心概念

### 1. 語義骨架 (Semantic Skeleton)
可序列化、可版本化、可差分比對的結構化語義物件。

三層結構：
- **宏觀層 (Division)**：對應技術文件的 Part/Division
- **中觀層 (Segment)**：對應章節
- **微觀層 (Block)**：8-Block 標準格式

### 2. 語義張力場 (Semantic Tension Field)
多源張力的向量疊加，驅動任務續行。

張力場結構：
```json
{
  "sources": [
    { "segment": 3, "intensity": 0.8, "direction": "forward", "type": "structural" }
  ],
  "resultant": { "magnitude": 0.73, "primary_direction": "segment_4" }
}
```

### 3. 三位一體鉤子 (Semantic Hook Vector)
語義向量 + 結構指標 + 語氣指紋 的複合錨點。

```json
{
  "semantic": { "key_concepts": ["語義張力", "補全模式"], "summary": "..." },
  "structural": { "division_id": "I", "segment_id": 1, "position": 0.95 },
  "tonal": { "formality": 0.9, "density": 0.8, "register": "technical-engineering" }
}
```

---

## 快速開始

### 驗證骨架文件

**Python:**
```bash
pip install jsonschema
python validate_skeleton.py examples/example-01-simple.json
python validate_skeleton.py --all  # 驗證所有示例
```

**Node.js:**
```bash
npm install ajv ajv-formats
node validate_skeleton.js examples/example-01-simple.json
```

### 創建新骨架

1. 複製 `examples/example-01-simple.json` 作為模板
2. 修改 `skeleton_id`、`title`、`metadata`
3. 添加 `divisions` 和 `segments`
4. 運行驗證腳本確認格式正確

---

## 8-Block 標準格式

每個 Segment 可包含以下區塊類型：

| 區塊類型 | 用途 |
|----------|------|
| `definition` | 定義核心概念 |
| `structure` | 結構化描述 |
| `flow` | 運作流程 |
| `submodules` | 子模組列表 |
| `rules` | 規則與約束 |
| `interface` | 介面定義 |
| `limits` | 限制與風險 |
| `extensions` | 延展可能 |
| `custom` | 自定義區塊 |

---

## 技術突破點

| 突破點 | 技術對應 | 市場差異化 |
|--------|----------|------------|
| 語義張力理論 | U-Semantic Tension + Tension Wave | 首個將「未完成感」量化為驅動長文生成的機制 |
| 雙模式引擎 | OSC-A（外部觸發）+ OSC-B（語義自驅） | 首個定義「震盪」與「補全」作為互補生成模式 |
| 8-Block 標準格式 | 固定結構 API | 首個將 LLM 長文生成標準化為可審計格式 |
| 語義 QC 三軸 | FR / SR / MR 監測 | 首個將長文品質拆解為節奏、結構、記憶三層 |
| 跨模型範式 | 語義骨架 + 語氣協議 | 不依賴特定模型，可移植至任意 LLM |

---

## 斷點恢復協議

當任務中斷需要恢復時：

1. **載入骨架 JSON**
2. **定位當前位置**（檢查 `status: "in_progress"` 的段落）
3. **注入最高張力點的鉤子**
4. **生成恢復 prompt**

恢復 prompt 模板：
```
你正在續寫一份技術文件。

當前位置：Division {division_id} / Segment {segment_id} / Chapter "{chapter}"
完成度：{completion_ratio}%
張力場：主方向 → {primary_direction}，強度 {magnitude}

上下文鉤子：
- 語義：{semantic.summary}
- 語氣：{tonal.register}，正式度 {formality}

請從 {block_type} 區塊繼續。
```

---

## 版本控制

骨架遵循語義版本號 (SemVer)：
- **MAJOR**：不兼容的結構變更
- **MINOR**：新增功能（如新增 Division）
- **PATCH**：內容修正（如完成某 Segment）

每次變更應記錄在 `changelog` 字段。

---

## 授權

Proprietary - 安安 × 老翔宇宙 × SIC Protocol

---

## 相關文件

- OSC-A 技術工程書（安安震盪模式）
- ASEE v2 技術工程書（語義自動續寫引擎）
- LFC-LDQC 生息架構（長文品質控制）

---

## 貢獻者

- 安安 (Creator)
- GPT-語頻翔
- Claude-德德
- Gemini-評審
