# 更新日志 (Changelog)

本文档记录 **Antigravity Quota & Token Monitor** 扩展的所有重要版本更新。  
本格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，并遵循 [语义化版本规范 (SemVer)](https://semver.org/lang/zh-CN/)。

## [1.4.0] - 2026-10-23

### ✨ 重大新增 (Features)
* **Gemini 4 Argon 独立周配额池支持 (Gemini 4 Argon Support)**：
  * 完美适配 Antigravity 最新桌面端及服务端的 `Gemini 4 Argon` 架构。
  * 独立周配额健康度监测：提取 `gemini-argon-wtu-weekly` 配额桶，在大盘中动态渲染专属靛青渐变卡片、周额度进度条与独立重置倒计时。
  * 修复了以往任意包含 `gemini` 名称的分组会意外互相覆盖配额的逻辑缺陷。
* **Google AI Pro 会员权限智能判定 (Pro Tier Identification)**：
  * 精准区分活动领取版 Pro（无 3P/Claude 权限）与付费版 Pro（拥有完整 Claude 权限）。
  * 针对活动版 Pro 用户，卡片友好展示 `未开通 3P 权限 (活动版 Pro 专享 Gemini)` 提示与弱化虚线面板，状态栏与悬浮窗同步显示专享标识，避免误报为 0% 或故障。
* **Claude 5.5 全面升级与动态模型规格 (Claude 5.5 & 1M Context)**：
  * 彻底移除旧版写死的 `Claude Opus 4.6` 与 `Claude Sonnet 4.6` 硬编码。
  * 全面升级支持 `Claude Opus 5.5` 与 `Claude Sonnet 5.5`，原生上下文上限直接匹配官方最新规格 **`1,000,000 (1M)`**。
  * 实时从 Antigravity 官方 LanguageServer 动态检索可用模型配置列表与各模型推荐用量。

---

## [1.3.1] - 2026-10-15

### ✨ 优化与多平台协同 (Enhancements & Multi-Platform)
* **固化数据来源平台标识 (`source: "gemini"`)**：
  * 同步 Payload 中固定声明 `source: "gemini"`，不可篡改，明确标识反重力 IDE / Gemini 渠道。
  * 完美适配服务端的多平台 Token 聚合大盘，支持与 Cursor、Claude 等平台独立区分与一键全局汇总。
* **配置向导与验证机制强化**：
  * 引入保存前服务端握手鉴权校验，输入错误密钥时当场拦截报错，避免假保存。
  * 移除密码框歧义遮罩并新增单项管理菜单（支持单独测通、修改密钥、修改地址）。

---

## [1.3.0] - 2026-10-15

### ✨ 重大新增 (Features)
* **远程云端/服务器自动同步 (Remote Token Stats Synchronization)**：
  * 新增 `src/sync_client.js` 同步引擎，支持将本地持久化热力图与统计快照实时推送到自建 NestJS/HTTP 后端服务器。
  * 完美适配后端鉴权保护，自动发送 `x-sync-secret` 与 `Authorization: Bearer` 双鉴权请求头。
  * 支持 3 种数据隐私模式：完整模式 (`full`，含项目明细)、脱敏模式 (`anonymized`，项目名自动匿名化)、纯热力图模式 (`public`，仅保留天级图表数据)。
  * 支持后台定时自动同步（可配置周期，默认 10 分钟）与静默后台容错。
* **交互式配置向导与快捷入口 (Interactive Config Wizard & UI Actions)**：
  * 新增快捷命令 `antigravity-quota.configSync`，分步引导输入服务端接口地址、密钥并选择模式，保存后可一键测试连接。
  * 侧边栏大盘顶部新增 **`☁️ 同步`** 快捷按钮（未配置时自动引导向导，已配置后一键立即推送）。
  * 底部状态栏菜单新增「立即同步 Token 数据」与「配置云端同步 (接口地址与密钥)」。
  * 完善 VS Code 全局设置项 `antigravityQuota.sync.*`，密钥与接口严格保存在本地全局用户配置，避免意外提交到代码仓库。

---

## [1.2.0] - 2026-10-14

### ✨ 重大新增 (Features)
* **本地永久持久化归档引擎 (Persistent Token Archive Engine)**：
  * 新增 `src/token_archive.js`，基于增量快照合并算法，在 VS Code 全局持久化存储区自动归档每日时间序列与全量会话数据。
  * **热力图与总消耗永久防丢**：即使本地对话 SQLite 数据库被删除或项目被清理，历史 GitHub 24 周贡献热力图、连续打卡天数与历史累计 Token 总数绝对不丢失，实现只增不减。
  * **快捷归档查看**：状态栏与 QuickPick 菜单新增「查看本地持久化归档 (token_history_archive.json)」选项，随时在编辑器内一键查验归档数据。
  * **本地项目列表清爽模式**：本地会话已完全清理的项目自动从侧边栏列表中隐藏，界面专注活跃工程，底层数据完整归档备用。
  * **预留云端同步导出接口**：内置 `exportDataForSync`，支持对外脱敏与数据导出，为后续网页大盘展示奠定基础。

---

## [1.1.1] - 2026-09-17

### 🐛 修复 (Fixed)
* **刷新提示未定义缺陷**：修复点击刷新按钮及账号卡片触发手动刷新时，底部 Toast 提示条显示为 `undefined` 的多语言字段缺失缺陷。

### ✨ 文档与社区 (Docs & Community)
* **支持与赞助模块**：在中英文说明手册（`README.md` 与 `README_EN.md`）中引入微信专属赞赏码，方便用户请作者喝杯咖啡 ☕。

---

## [1.1.0] - 2026-09-14

### ✨ 新增与优化 (Enhancements)
* **跨平台原生头像检测 (Cross-platform Native Google Avatar Detection)**：
  * 增强用户头像路径探测算法，全面适配 Windows、macOS 与 Linux 系统下 Antigravity IDE 本地配置提取。
* **CI/CD 自动化多端同步发布 (Automated Multi-Platform Release Pipeline)**：
  * 新增 GitHub Actions 工作流，通过打 Tag 一键自动构建、生成 GitHub Release、同步上架至微软 VS Code Marketplace 及 Eclipse Open VSX Registry。

---

## [1.0.18] - 2026-09-11

### ✨ 新增特性 (Added)
* **用户头像原生显示 (Native Google Avatar Display)**：
  * 自动从 Antigravity IDE 本地配置中无缝识别当前登录用户的 Google 原生高清头像。
  * 顶部个人信息卡片告别原本的首字母圆圈，直接展示个性化头像，无网络授权请求，零隐私泄露。

---

## [1.0.17] - 2026-09-11

### ✨ 新增特性 (Added)
* **历史项目与会话本地清理 (Session & Project Cleaner)**：
  * **单会话精准删除**：展开历史项目后，点击会话条目右侧 🗑️ 图标，弹出模态确认框后彻底清理该会话的本地 SQLite 数据库及 `brain` 缓存，IDE 历史下拉菜单与插件面板同步移除。
  * **整项目批量清空**：历史项目卡片右侧提供 🗑️ 图标，一键清空该项目下的所有历史会话并从统计中移除。
  * **多重安全防护**：源码绝对隔离（绝不触碰真实代码文件）；当前正在对话的活跃会话自动拦截防护。
  * **磁盘空间释放通知**：删除成功后实时反馈释放的磁盘空间大小。

### 🐛 修复 (Fixed)
* **今日 Token 统计大盘与热力图归属错误**：修复了在长会话中因 `gen_metadata` 序列号与 `steps` 序列号不一致导致今日产生的所有 Token 被误映射回历史日期的缺陷，精准通过 `last_step_index` 绑定真实时间戳。

---

## [1.0.16] - 2026-09-08

### 🏗️ 重大架构重构 (Architectural Refactoring)
* **Webview 纯前端代码全面解耦**：
  * 将原本混杂在 `src/webview_ui.js` 巨型模板字面量中的 2000 多行代码，彻底解耦为标准的现代 Web 工程三层架构：
    * `src/views/index.html`：纯语义化 HTML5 页面骨架；
    * `src/views/style.css`：独立 CSS 样式表，包含完整的自适应明暗双主题；
    * `src/views/app.js`：纯前端数据渲染、交互逻辑与 I18N 国际化。
  * `src/webview_ui.js` 精简至 60 行，转变为规范化的资源加载器，使用 `webview.asWebviewUri` 注入静态资源并动态生成 32 位 Nonce 与 CSP 安全头部。
* **独立浏览器调试支持**：`src/views/index.html` 现在支持直接双击在 Chrome / Edge 打开预览并按 F12 调试样式。

---

## [1.0.15] - 2026-09-08

### 🐛 修复 (Fixed)
* **热力图格子隐形问题**：统一并修复了 `.heat-lvl-0` 至 `.heat-lvl-4` 的明暗主题样式声明，消除了浅色主题下仅今天方块可见、其余方块透明隐形的缺陷。
* **月份重叠冲突**：优化 24 周跨度动态月份计算算法，修复第 0 列月末残留导致的“MarApr”文字重叠，增加 $\ge 3$ 列防碰撞安全间隔保护。
* **星期坐标轴滚动丢失**：重构热力图为 `Flex Wrapper` 架构，左侧 `Mon / Wed / Fri` 标签固定常驻（Pinned），右侧网格横向滚动时左侧标签不再被移出视图。

---

## [1.0.14] - 2026-09-08

### 🐛 修复 (Hotfix)
* **模板字面量英文引号转义**：修复了英文词典中含所有格单引号在嵌入时引发的 `SyntaxError`，确保 Webview 初始化和数据更新 100% 顺畅。

---

## [1.0.13] - 2026-09-08

### 🌐 新增特性 (Added)
* **全链路中英文双语无缝切换**：
  * 顶部导航栏新增 `🌐 EN` / `🌐 中文` 一键切换按钮；
  * 智能单位本地化：中文环境采用 **万 / 亿** 计量，英文环境无缝切换为国际通用的 **K / M / B** 计量；
  * 全局状态联动：状态栏文本、鼠标悬停 Markdown 浮窗表格与侧边栏大盘 100% 保持语言同步。
* **双语官方使用文档**：新增完整的英文版使用手册 `README_EN.md`。

---

## [1.0.12] - 2026-09-08

### ⚡ 新增特性 (Added)
* **上下文窗口使用率监控 (Context Window Gauge)**：
  * 新增当前会话上下文占用与上限的实时容量指示条（如 `3.09万 / 1M · 2.9%`）；
  * 精准感知模型上下文超限风险，避免上下文截断与压缩失真。

---

## [1.0.10] - [1.0.11] - 2026-09-07

### 📊 新增特性 (Added)
* **24 周 GitHub 活跃贡献热力图**：
  * 实现 24 周（168天）高密度翡翠绿强度渐变贡献图；
  * 鼠标悬停即时查看单日消耗明细与交互轮次；
  * 统计连续编码活跃天数（Streaks）、历史单日消耗峰值（Peak Day）与编码一致性百分比。

---

## [1.0.6] - [1.0.9] - 2026-09-06

### ✨ 新增特性 (Added)
* **双模型额度池深度整合**：合并细碎模型展示为官方标准的 **Gemini 额度池 (1M 上下文)** 与 **Claude & GPT 额度池**。
* **5 小时滚动限流监控**：实时展示 5 小时重置倒计时与剩余百分比，三色健康指示灯（🟢 🟡 🔴）。
* **历史项目与会话折叠下钻**：支持查看不同项目工作区的消耗排行，并可展开查看会话粒度的 Token 明细。

---

## [1.0.0] - [1.0.5] - 2026-09-05

### 🚀 初始版本发布 (Initial Release)
* 实现 Antigravity 官方 Language Server 自动进程探测与 Connect-RPC 认证查询；
* 实现本地 SQLite 数据库只读模式分析，提取输入、缓存、输出与思考 Token；
* 底部状态栏极简集成与快捷操作菜单。
