# 隐私与数据安全政策 (Privacy & Security Policy)

**最后更新时间：** 2026-09-08  
**适用扩展：** `antigravity-quota-tokens` (Antigravity Quota & Token Monitor)

---

## 核心原则 (Core Commitment)

你的代码、提示词与个人数据**永远不会离开你的本地设备**。

本扩展不包含任何外部网络请求代码、不包含任何第三方分析跟踪 SDK（如 Google Analytics、Sentry、Telemetry 等）。唯一发生的网络通信是在你自己的计算机内部通过 `127.0.0.1` 本地环回接口与 Google Antigravity 官方语言服务进行通信。

---

## 插件读取的数据清单 (What We Read)

本插件仅在本地读取以下与用量、额度相关的元数据：

| 读取数据项 | 数据来源 | 访问方式 | 用途说明 |
| :--- | :--- | :--- | :--- |
| **模型实时配额与重置时间** | 本机运行的 Antigravity 语言服务进程 | `127.0.0.1` 环回 Connect-RPC (`GetUserStatus`)，带 CSRF Bearer 保护 | 在侧边栏大盘和状态栏展示官方额度池剩余与 5h 重置倒计时 |
| **会话 Token 统计数值** | `~/.gemini/antigravity*/conversations/*.db` | SQLite 严格只读模式 (`?mode=ro&immutable=1`, `PRAGMA query_only = ON;`) | 统计输入、缓存、输出与思考 Token 数值，绘制热力图 |
| **会话元数据（标题与轮次）** | 本地 SQLite 会话表 | 仅提取 `title`、`step_count` 与时间戳 | 在“历史项目与会话明细”中进行列表展示与折叠下钻 |
| **工作区项目名称** | 会话关联的工作区目录名 | 本地路径提取 Basename | 按工作区归类统计 Token 消耗 |

---

## 严正声明：插件绝不进行的行为 (What We Never Do)

1. **零外部网络连接 (Zero External Requests)**：
   - 绝不向任何外部公网服务器发起请求或上传数据。你可以在 VS Code 开发者工具的 Network 面板或通过防火墙软件随时验证，本扩展在离线断网环境下依然 100% 正常工作。
2. **绝不收集对话内容与源码 (No Prompt or Code Extraction)**：
   - 绝不读取、存储或传输你的任何 Prompt 提示词文本、大模型回复文本、文件内容或项目源代码。
3. **零数据库修改与加锁风险 (Zero Database Locks)**：
   - 所有数据库查询均在只读模式下执行，绝不执行任何 `INSERT`、`UPDATE`、`DELETE` 操作，绝不污染或损坏 Antigravity 官方数据库。
4. **安全沙箱隔离 (Content Security Policy)**：
   - 侧边栏 Webview 运行在完全隔离的 iframe 沙箱中，配置了严格的 `default-src 'none'` Content-Security-Policy (CSP) 与动态生成的 32 位 Nonce 防护，杜绝任何 XSS 注入风险。

---

## 意见与安全反馈

如对本插件的隐私与安全机制有任何疑问，或发现潜在安全风险，欢迎在 GitHub / Gitee 提交 Issue 或通过私信联系维护者。
