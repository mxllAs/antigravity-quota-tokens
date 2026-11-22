# Antigravity Desktop 插件集合 (`agy-app-Plugins`)

本目录专门存放适配 **Antigravity 桌面端 (`2.33.0+`)** 的原生扩展插件（Sidecar / MCP App / Skills / Hooks）。

- 与仓库根目录的 **IDE / VS Code VSIX 扩展**（`antigravity-quota-tokens`）共用同一个 Git 仓库，方便在公司与家里随时 `git pull` 同步与二次开发。
- 已在 `.vscodeignore` 中配置 `agy-app-Plugins/**`，打包 `.vsix` 扩展时会自动忽略，互不干扰。

---

## 📦 已包含插件清单

| 插件目录 | 显示名称 | 核心功能 | 说明文档 |
| :--- | :--- | :--- | :--- |
| [`agy-chat-metrics/`](agy-chat-metrics/) | **Chat Metrics (Context & Speed)** | 聊天框底栏内嵌显示当前会话**上下文占比 (%)** 与 **Token 生成速度 (`tok/s`)**，跟随桌面端主题自动变色（无右侧面板） | [README.md](agy-chat-metrics/README.md) |
| [`agy-model-picker/`](agy-model-picker/) | **Periodic Model & Effort Picker** | 左键呼出 **Gemini 4 元素周期表 + 自适应推理强度滑块**（右键/`Shift+点击`保留原生菜单） | [README.md](agy-model-picker/README.md) |
| [`agy-zh-cn/`](agy-zh-cn/) | **Antigravity Desktop 中文汉化** | 非入侵式汉化桌面端 **Settings 设置面板、侧边栏导航与顶部菜单**，不改 `app.asar`，支持设置页一键中/英切换 | [README.md](agy-zh-cn/README.md) |

---

## 🚀 快速安装 / 更新（公司 & 家里通用）

在 PowerShell 中进入本目录运行统一安装脚本（自动扫描并部署本目录下所有含 `plugin.json` 的插件到 `%USERPROFILE%\.gemini\config\plugins\`）：

```powershell
cd agy-app-Plugins

# 安装 / 更新全部桌面端插件（同时为 Antigravity 快捷方式配置调试参数）
.\install.ps1

# 或只安装 / 更新指定插件：
.\install.ps1 -Plugin agy-chat-metrics
```

### 卸载
```powershell
# 卸载全部本仓库管理的桌面端插件
.\uninstall.ps1

# 卸载指定插件（加上 -RestoreShortcuts 可同时还原快捷方式参数）
.\uninstall.ps1 -Plugin agy-chat-metrics
```

---

## 🧩 新增更多桌面端插件的目录规范

后续每新增一个独立功能的桌面端插件，只需在本目录下新建一个文件夹：

```text
agy-app-Plugins/
├── README.md
├── install.ps1
├── uninstall.ps1
├── agy-chat-metrics/          # 插件 1：聊天框底栏上下文占比 & Token 速度
│   ├── README.md
│   ├── plugin.json
│   ├── assets/logo.svg
│   └── sidecars/...
└── <your-next-plugin>/        # 插件 2：保持单插件单一职责，可独立开关
    ├── README.md
    ├── plugin.json
    └── ...
```

- 每个子目录只需包含 `plugin.json`，`install.ps1` 会自动识别并部署。
- 建议保持**一个插件只聚焦一个独立能力**，这样在桌面端 `Customizations -> Plugins` 中可以各自独立启停、互不影响。
