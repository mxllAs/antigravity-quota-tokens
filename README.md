# Antigravity Quota & Token Monitor

<p align="center">
  <b>沉浸式 Google Antigravity 配额限流监测 · 上下文容量水位 · Token 深度分析大盘</b>
</p>

<p align="center">
  <a href="README.md">🇨🇳 简体中文使用手册</a> &nbsp;|&nbsp; <a href="README_EN.md">🇺🇸 English User Manual</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-v1.0.12-3b82f6.svg" alt="version" />
  <img src="https://img.shields.io/badge/platform-Google%20Antigravity%20IDE-f59e0b.svg" alt="platform" />
  <img src="https://img.shields.io/badge/license-MIT-10b981.svg" alt="license" />
  <img src="https://img.shields.io/badge/security-100%25%20Local%20Readonly-purple.svg" alt="security" />
</p>

---

## 📖 简介

**Antigravity Quota & Token Monitor** 是一款专为 **Google Antigravity IDE** 深度量身打造的开源扩展插件。

它通过轻量常驻的**底部状态栏**、快捷的 **QuickPick 菜单**，以及左侧活动栏的**现代化全景可视化大盘**，为你提供 Antigravity 核心配额限流、上下文饱和度与算力 Token 消耗的全方位洞察：

- **⚡ 事实限流双轨制**：实时监控 5 小时滚动限流（主要触发源）与周额度健康度，归类 Gemini 与 Claude/GPT 共享额度池；
- **🧠 上下文容量水位**：捕获当前交互模型（如 `Gemini 3.8 Flash`）与上下文窗口（`1M` / `200k`），配备动态彩色饱和度进度条；
- **📊 今日四维消耗大盘**：新鲜输入 (Input)、提示词缓存 (Cache)、生成输出 (Output) 与思考推理 (Thinking) 深度解析；
- **🟩 GitHub 24 周贡献热力图**：像素级复刻 GitHub 绿色贡献网格，统计连续打卡与历史峰值；
- **📁 历史项目消耗明细**：分项目查看历史会话轮次与 Token 消耗，默认折叠收起、按需展开；
- **🎨 原生设计美学**：矢量极简仪表闪电图标 + 全局 6px 极细悬浮圆角滚动条，完美融入深色与浅色主题。

---

## 🌟 核心特性详解

### 1. ⚡ 5小时滚动限流 + 周额度双轨制（官方 RPC 深度接入）

Google Antigravity 采用双轨额度机制。本插件通过底层 Connect-RPC 接口（`GetUserStatus` 与 `RetrieveUserQuotaSummary`）精准解析：

- **事实额度（5小时滚动限流）**：日常遭遇的频繁限流通常由 5 小时速率限制引起。插件将其常驻于底部状态栏与大盘首要位置（如 `🟢 Gemini 63% (3h 3m) | 🟢 Claude/GPT 100%`），提供实时重置倒计时与红黄绿状态灯；
- **周额度健康度（Weekly Limit）**：作为长周期限额，采用轻量柔和的虚线行与悬停表格展示（如 `📅 周额度健康度: 剩余 82%`），心中有数且不干扰日常编码；
- **两大额度池清晰分类**：
  - **Gemini 额度池**：Gemini 3.8 / 3.7 / 3.6 / Flash / Pro 全型号共享；
  - **Claude & GPT 额度池**：Claude 3.5/3.7 Sonnet / Opus 4.6 与 GPT-OSS 共享。

---

### 2. 🧠 当前会话意图与上下文容量饱和度

- **会话意图标题全幅独占**：智能解析 SQLite 快照提取会话主题（如 `"当前文件夹项目分析"`、`"前端重构与接口联调"`），整行通栏展示，彻底消除单字截断；
- **原生模型与上下文上限检测**：
  - 自动识别当前会话交互的精确模型（例如 `Gemini 3.8 Flash`，上限 `1M`；或 `Claude 3.7 Sonnet`，上限 `200k`）；
- **4px 动态彩色容量指示条**：
  - `< 75%`：科技蓝（安全裕度充足）；
  - `75% ~ 90%`：预警橙（接近饱和，建议适时精简或开新会话）；
  - `> 90%`：高危红（即将溢出引发总结或遗忘）。
- **底部状态栏即时同步**：显示格式如 `$(circuit-board) 上下文: 3.09万/1M (2.9%)`，时刻掌握会话水位。

---

### 3. 📊 今日 Token 四维深度消耗大盘

不仅统计数字，更深入四维构成的底层逻辑：

1. **新鲜输入 (Input)**：本轮提示词中全新注入的代码与上下文；
2. **缓存命中 (Cache)**：Gemini 提示词缓存（Prompt Cache）命中量，大盘实时换算**缓存命中率（如 95.6%）**，直观感受大幅提速降载；
3. **模型生成 (Output)**：模型实际回复并吐出的 Token 词数；
4. **思考推理 (Thinking)**：模型在隐式思考通道（CoT / Reasoning）中的推理消耗；
5. **智能中文单位换算**：提供符合直觉的 `万` 与 `亿`（如 `5731.6 万`、`2.27 亿`），同时悬停展示精确至个位数的原始 Token。

---

### 4. 🟩 像素级复刻 GitHub 24 周贡献热力图

完全对齐 GitHub canonical 贡献日历布局，记录你在 Antigravity 中的每一次灵感爆发：

- **完整月份与工作日纵轴**：顶部自适应月份标签（`May`, `Jun`, `Jul`...），左侧标准工作日标尺（`Mon`, `Wed`, `Fri`）；
- **四阶绿度与高亮当天**：动态按消耗区间自适应渲染 GitHub 经典的四个浓淡绿阶，当前所在日期配备青色呼吸外边框；
- **打卡数据统计看板**：
  - **活跃天数与出勤率**：如 `活跃: 11 天 (7%)`；
  - **历史峰值日**：如 `峰值: 09-03 · 1.73 亿`；
  - **连续打卡天数 (Streak)**：如 `连续: 2 天`；
  - **近 24 周累计消耗总量**：如 `近 24 周累计 6.14 亿`。

---

### 5. 📁 历史项目消耗穿透明细

- **默认全部收起**：列表保持紧凑折叠，仅展示各项目名称（`📁 xxx`、`⭐ 当前项目`）与项目历史累计 Token；
- **点击按需穿透**：点击项目标题平滑展开该项目下的所有历史会话明细，包括会话短 ID、创建时间、轮次、各会话绑定的上下文占用及消耗；
- **去繁就简**：界面专注纯粹的数据看板，没有任何多余且无效的干扰按钮。

---

### 6. 🎨 原生设计美学与视觉体验

- **活动栏专属矢量图标**：摒弃模糊的细线多轨原子环，重构为符合 VS Code / Codicons 标准 2px 几何线宽的 **「配额仪表盘 + 算力闪电 (Quota Gauge & Lightning Core)」**，使用 `currentColor` 完美自适应浅色与深色主题；
- **全新 6px 极细悬浮滚动条 (Sleek Scrollbars)**：干掉 Windows 系统默认 15px 粗重的灰块滚动条，换上完全透明轨道、轻量圆角悬浮胶囊，释放宝贵的侧边栏横向展示空间。

---

## 🖥️ 界面全景与使用场景

### 1. 底部状态栏 (Status Bar)

常驻在 IDE 窗口右下角，由左至右包含四大核心指示区：

```text
🟢 Gemini 63% (3h 3m) | 🟢 Claude/GPT 100% | $(circuit-board) 上下文: 3.09万/1M (2.9%) | $(folder) 本项目: 4074 万
```

- **指示灯状态**：
  - 🟢 绿色：剩余额度 > 50%
  - 🟡 黄色：剩余额度 20% ~ 50%
  - 🔴 红色：剩余额度 < 20%（即将触发挥霍限流）

### 2. 状态栏鼠标悬停 (Tooltip Markdown 表格)

鼠标悬停在状态栏上，即可直接展开精致的 Markdown 分析卡片：

| 模型额度池 | 5小时滚动限流 | 周额度健康度 | 原生上下文上限 |
| :--- | :---: | :---: | :---: |
| 🟢 **Gemini** (Pro/Flash 全型号共享) | 剩余 **63%** (3h 3m 后重置) | 剩余 **82%** (2天16小时) | **1M (100万)** |
| 🟢 **Claude & GPT** (Sonnet/GPT-OSS 共享) | 剩余 **100%** | 剩余 **100%** | **200k (20万) · GPT 128k** |

- 同屏附带当前会话上下文占用、轮次、项目总消耗及快捷操作提示。

### 3. 一键快捷操作菜单 (QuickPick)

点击状态栏即可呼出 QuickPick 交互面板：
- **查看与复制 Token 统计报告**：一键生成格式美观的 Markdown 汇报文本并拷入剪贴板；
- **历史项目消耗排行**：弹出全部项目的详细消耗列表；
- **立即刷新配额与数据**。

---

## 🔒 底层架构与数据安全

本扩展遵循极致的安全与性能准则：

1. **100% 本地运行，零数据外流**：
   - 不依赖任何第三方云端 API 或后端中转服务；
   - 绝不收集、上传你的提示词、对话内容或个人账号信息；
2. **SQLite 进程级只读安全 (Zero Lock)**：
   - 提取会话 Token 数据时，采用只读连接（`PRAGMA query_only = ON;`）与 WAL 并发模式；
   - 绝不给 Antigravity 数据库加写锁，绝不修改、删除或污染任何官方对话记录；
3. **自动进程探测与安全认证**：
   - 启动时自动搜索本机运行的 Antigravity Language Server 进程，解析进程参数中的 CSRF 验证令牌；
   - 仅在 `127.0.0.1` 环回接口发起安全 RPC 查询，无需手动配置复杂的 API Token 或密钥。

---

## ⚙️ 配置项 (Settings)

按 <kbd>Ctrl + ,</kbd> 打开设置，搜索 `antigravityQuota` 即可个性化调整：

| 配置项 | 默认值 | 说明 |
| :--- | :---: | :--- |
| `antigravityQuota.showStatusBar` | `true` | 是否在底部状态栏显示指示器 |
| `antigravityQuota.autoRefreshSeconds` | `60` | 自动刷新频率（单位：秒，最低 15 秒） |
| `antigravityQuota.showGemini` | `true` | 是否在状态栏显示 Gemini 额度池 |
| `antigravityQuota.showClaude` | `true` | 是否在状态栏显示 Claude/GPT 额度池 |
| `antigravityQuota.pythonPath` | `""` | 指定 Python 解释器路径（默认留空自动探测） |

---

## 📦 安装与快速开始

### 方式 1：直接安装 VSIX 安装包（推荐）

1. 下载最新的打包文件：`antigravity-quota-tokens-1.0.16.vsix`；
2. 打开 Antigravity IDE，按快捷键 <kbd>Ctrl + Shift + X</kbd> 打开扩展面板；
3. 点击面板右上角的 `...` 菜单，选择 **“从 VSIX 安装... (Install from VSIX...)”**；
4. 选择该 `.vsix` 文件安装，完成后点击右下角 **“重新加载 (Reload Window)”** 即可立即享受。

### 方式 2：本地源码打包与构建

如果你想自行构建或进行二次开发：

```bash
# 1. 克隆或进入插件目录
cd antigravity-quota-tokens

# 2. 运行自动化语法检测
npm test

# 3. 本地打包生成 VSIX
npx @vscode/vsce package --no-dependencies
```

打包完成后将在根目录下生成 `antigravity-quota-tokens-x.x.x.vsix`。

---

## ❓ 常见问题 (FAQ)

<details>
<summary><b>Q1: 为什么有时候周额度还有很多，模型却提示限流了？</b></summary>
这是 Google Antigravity 的核心保护策略。Antigravity 的事实限流主要由 <b>5 小时滚动窗口（5-Hour Rolling Limit）</b> 决定。周额度是整个计费周期的总量健康度，而短时间内密集发送大量 Prompt 或大型上下文会先触碰 5 小时速率上限。查看本插件状态栏的 5h 剩余与倒计时即可精确掌握恢复时间。
</details>

<details>
<summary><b>Q2: 插件会影响 Antigravity 对话性能或导致卡顿吗？</b></summary>
完全不会。插件后台采用异步非阻塞调用，SQLite 连接全面开启 <code>query_only</code> 与只读快照机制，耗时通常仅为数毫秒，刷新在后台静默完成，对 IDE 运行零感知。
</details>

<details>
<summary><b>Q3: 为什么点击历史会话不能直接切换右侧的 AI 聊天窗口？</b></summary>
Antigravity IDE 的右侧 AI 聊天面板是深度集成在底层 VS Code 工作台核心中的专有组件，并非标准插件 Webview。目前官方未对外开放支持直接跳转指定会话 ID 的公共 API。切换会话建议使用 Antigravity 原生快捷键 <kbd>Ctrl + Shift + A</kbd> 唤起会话选择器。
</details>

---

## 📄 开源许可证

本项目基于 MIT License 协议开源。
