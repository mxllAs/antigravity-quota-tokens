# Antigravity Desktop 聊天框底栏内嵌插件 (`agy-chat-metrics`)

> 本目录是独立配套 **Antigravity 桌面端 (2.33.0+)** 的极简原生 Sidecar 插件源码，与根目录的 IDE/VS Code 扩展（`antigravity-quota-tokens` VSIX）相互独立，打包 `.vsix` 时已通过 `.vscodeignore` 自动排除。

---

## ✨ 功能特性

在桌面端聊天输入框底栏、模型选择器（如 `Gemini 4 Hydrogen High`）右侧内嵌两个轻量胶囊，**不占用右侧辅助面板**：

1. **上下文窗口占比**：
   - 圆形进度环 + 实时占用百分比（`<75%` 绿、`75–89%` 黄、`≥90%` 红）。
   - 悬停 / 点击展开卡片：展示精确已用 / 容量上限（如 `410.5K / 512K`）、剩余可用 Token、当前模型名，以及 5h / 周剩余额度。
2. **Token 生成速度 (`tok/s`)**：
   - 闪电图标 + 实时生成速率（模型生成中显示脉冲呼吸指示点）。
   - 自动过滤 `<0.35s` 的极短突发传输异常样本，计算真实流式速率。
   - 悬停 / 点击展开卡片：展示最近速率、会话加权均速、峰值速率、平均首字耗时（TTFT）、正文 / 思考输出量与缓存命中率。
3. **动态主题自适应**：
   - 使用 Shadow DOM 隔离样式，实时读取宿主 `--background`、`--foreground`、`--card`、`--border`、`--font-family` 等 CSS 变量并计算明暗亮度，无缝适配暖米白浅色 / 深色 / 自定义主题。

---

## 📁 目录结构

```text
agy-app-Plugins/agy-chat-metrics/
├── README.md                          # 本文档（安装、原理与二次开发说明）
├── plugin.json                        # Antigravity 插件清单
├── assets/
│   └── logo.svg                       # 插件图标
└── sidecars/
    └── metrics_bar/
        ├── package.json               # ESM 模块声明
        ├── sidecar.json               # 无界面后台 Sidecar 配置 (has_web_ui: false)
        ├── main.mjs                   # 后台注入器：监听 DevToolsActivePort 并通过 CDP 注入前端
        ├── collector.mjs              # 数据采集：调用本地 LanguageServer RPC 计算上下文与 TPS
        └── widget.js                  # 前端 Shadow DOM 组件与悬停详情卡片
```

---

## 🚀 在另一台电脑（或回家后）安装与更新

### 1. 一键安装
拉取最新仓库代码后，在 PowerShell 中进入 `agy-app-Plugins` 目录执行：

```powershell
cd agy-app-Plugins
.\install.ps1 -Plugin agy-chat-metrics
```

脚本会自动完成两件事：
1. 将插件文件复制到 `%USERPROFILE%\.gemini\config\plugins\agy-chat-metrics\`。
2. 为桌面 / 开始菜单 / 任务栏中的 `Antigravity.lnk` 快捷方式追加本机回环调试参数：
   `--remote-debugging-port=0 --remote-debugging-address=127.0.0.1`
   （Antigravity Desktop `2.33.0+` 默认关闭了调试端口，必须有该参数才会生成 `DevToolsActivePort` 供后台注入使用；**全程不修改 `app.asar` 安装包文件**）。

### 2. 生效方式
- **首次安装**：完全退出 Antigravity 桌面端（包括系统托盘后台图标），再从桌面或开始菜单快捷方式重新打开即可。
- **后续修改代码后更新**：在当前目录改完代码重新运行 `..\install.ps1 -Plugin agy-chat-metrics`，然后在桌面端左侧 `Customizations -> Plugins` 中把 **`Chat Metrics (Context & Speed)`** 开关关掉再打开（或重启桌面端）即可加载新代码。

### 3. 卸载
```powershell
cd agy-app-Plugins
.\uninstall.ps1 -Plugin agy-chat-metrics
```

---

## 🛠️ 二次开发与排障指南

- **数据来源（[collector.mjs](sidecars/metrics_bar/collector.mjs)）**：
  - 使用桌面端注入给 Sidecar 的环境变量 `ANTIGRAVITY_LS_ADDRESS` 与 `ANTIGRAVITY_CSRF_TOKEN`，直接调用本地 RPC：
    - `GetCascadeTrajectory`：读取 `generatorMetadata[].chatModel` 中的 `streamingDuration`、`timeToFirstToken`、`usage`（`responseOutputTokens` / `thinkingOutputTokens` / `inputTokens` / `cacheReadTokens`）及 `chatStartMetadata.contextWindowMetadata`。
    - `RetrieveUserQuotaSummary`：读取各模型池 5h 与周额度余量（30 秒缓存）。
- **注入锚点（[widget.js](sidecars/metrics_bar/widget.js)）**：
  - 查找可见的 `[data-testid="agent-input-box"]` 和 `[data-testid="model-selector-trigger"]`，通过 `c.branch.append(host)` 挂载在模型选择按钮右侧。
  - 会话 ID 优先读取 DOM 祖先节点上的 `data-cascade-id` 属性，其次解析 URL `/c/<id>`，实现多标签/分栏独立统计。
- **运行状态自检**：
  - 运行后可在 `%USERPROFILE%\.gemini\config\plugins\agy-chat-metrics\sidecars\metrics_bar\status.json` 查看实时挂载状态（`"state": "mounted"` 表示已成功注入界面；`"missing-debug-port"` 表示当前桌面端未使用调试参数启动）。
  - 后台日志路径：`%USERPROFILE%\.gemini\antigravity\sidecar_data\agy-chat-metrics\metrics_bar\logs\sidecar.log`。
- **注意**：`Customizations -> Plugins` 中的 `Chat Metrics (Context & Speed)` 即为本插件的后台挂载器，保留开启即可，不要点击卸载。
