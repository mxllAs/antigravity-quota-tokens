# Periodic Model & Effort Picker (`agy-model-picker`)

为 Antigravity 桌面端提供**元素周期表风格模型选择器 + 自适应推理强度滑块**：

## ✨ 功能特点

- **Gemini 4 元素周期表双视图（可一键切换）**
  - **元素卡片视图（默认）**：按原子序数整齐排列 `01 H`、`06 C`、`10 Ne`、`18 Ar` 卡片，右上角显示实时剩余配额或 `Ultra` 状态。
  - **周期表视图（Periods 1–3）**：以短周期主族位置呈现元素，第 1 周期中央展示当前/悬停元素的中文名称与定位说明。
- **Codex 风格回弹推理强度滑块**
  - 圆润胶囊轨道 + 拖动松手回弹吸附动画，自动按模型适配档位：`Hydrogen` / `Neon` 为 4 档（`Low · Medium · High · XHigh`），`Argon` / `Gemini 3.8 Flash` / `Claude 5.5` 为 3 档，`Orchestrator` / `GPT-OSS 120B` 为固定配置。
  - 切换模型时自动保持相近的推理强度档位。
- **扩展模型托盘 & 中文提示**
  - 统一浅色托盘列出 `Orchestrator (Neon / Argon)`、`Gemini 3.8 Flash`、`Claude Opus / Sonnet 5.5`、`GPT-OSS 120B` 及剩余配额，所有模型悬停/选中均提供中文功能说明。
- **原生菜单完整保留（零功能损失）**
  - 左键点击模型按钮：打开元素周期表 + 滑块弹窗。
  - **右键点击 / `Shift + 左键` / 弹窗右上角「原生」按钮**：随时打开 Antigravity 原生菜单（包含 `View Usage`、`Best of N` 等）。
