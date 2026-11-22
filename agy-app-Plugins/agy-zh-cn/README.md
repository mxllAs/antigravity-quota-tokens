# Antigravity Desktop 中文汉化 (`agy-zh-cn`)

非入侵式 **Antigravity Desktop**（桌面端）简体中文实时汉化插件（不影响 Antigravity IDE）。

## 核心特性

- **聚焦桌面端高频界面**：重点汉化 **Settings（设置面板全部标签页与选项说明）**、**左侧导航栏**、**顶部菜单栏（Workspace / View / Window 及下拉项）**、常用弹出框与操作按钮。
- **不改官方安装文件**：通过 CDP Sidecar 对桌面端渲染层进行实时文本替换，不修改 `app.asar`，官方版本升级后依然有效。
- **安全隔离，不误伤内容**：自动跳过对话正文、代码块（`pre` / `code` / 编辑器）、输入内容、项目名称、会话标题与模型名称。
- **支持中/英即时切换**：打开设置面板时右上角提供 `中 / EN` 切换胶囊，可一键还原英文或切回中文，状态写入本地 `localStorage`。
- **随关随复原**：在 Antigravity `Customizations -> Plugins` 中关闭或卸载本插件时，基于 `WeakMap` 保存的原始英文快照立即无损恢复英文界面。

## 安装方式

在仓库 `agy-app-Plugins` 目录下以 PowerShell 执行：

```powershell
.\install.ps1 -Plugin agy-zh-cn
```

然后完全退出并重新启动 Antigravity 桌面端，在 `Customizations -> Plugins` 中启用 **Antigravity Desktop 中文汉化** 即可。

## 卸载方式

```powershell
.\uninstall.ps1 -Plugin agy-zh-cn
```
