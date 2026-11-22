'use strict';

/**
 * Antigravity Desktop UI Simplified Chinese (zh-CN) Dictionary.
 * Sourced from live Antigravity Desktop 2.34.0 UI strings.
 * Intentionally excludes model names, user project/conversation names, and chat content.
 */

const EXACT_ZH_MAP = {
  // === Top Menu Bar & App Menu ===
  Workspace: '工作区',
  View: '视图',
  Window: '窗口',
  Help: '帮助',
  'Check for Updates': '检查更新',
  'Check for Updates...': '检查更新...',
  'Open Workspace': '打开工作区',
  'Open Folder': '打开文件夹',
  'Open Folder...': '打开文件夹...',
  'Create Project': '创建项目',
  'Create Project...': '创建项目...',
  'New Window': '新建窗口',
  'Close Window': '关闭窗口',
  'Close Tab': '关闭标签页',
  'Command Palette': '命令面板',
  'Open Settings': '打开设置',
  'Zoom In': '放大',
  'Zoom Out': '缩小',
  'Reset Zoom': '重置缩放',
  'Toggle Full Screen': '切换全屏',
  'Toggle Sidebar': '切换侧边栏',
  'Toggle Side Panel': '切换侧面板',
  'Toggle Maximize Side Panel': '切换最大化侧面板',
  'Toggle Overview Panel': '切换概览面板',
  'Split Terminal': '拆分终端',
  'Split Conversation Vertically': '垂直拆分会话',
  'Split Conversation Horizontally': '水平拆分会话',
  Minimize: '最小化',
  Maximize: '最大化',
  Restore: '还原',
  Close: '关闭',
  Reload: '重新加载',
  'Toggle Developer Tools': '切换开发者工具',
  Quit: '退出',
  Exit: '退出',

  // === Left Sidebar & Navigation ===
  'New Conversation': '新建会话',
  Automations: '自动化',
  Customizations: '自定义',
  Projects: '项目',
  'Show All': '显示全部',
  'Show Less': '收起',
  'Not in Project': '未归属项目',
  Conversations: '会话',
  'Give Feedback': '提供反馈',
  'Provide Feedback': '提供反馈',
  Feedback: '反馈',
  Settings: '设置',
  'Untitled project': '未命名项目',

  // === Settings Sidebar Screens ===
  General: '常规',
  Agents: '智能体',
  Environments: '环境',
  Application: '应用程序',
  Appearance: '外观',
  Shortcuts: '快捷键',
  Notifications: '通知',
  Models: '模型',
  Browser: '浏览器',
  Developer: '开发者',
  Running: '运行中',
  Account: '账号',
  Voice: '语音',
  'Voice mode': '语音模式',
  'Jetski Chat': 'Jetski 对话',

  // === Settings: General -> Interface Layout ===
  'Configure agent execution, queued message delivery, and permissions.':
    '配置智能体执行策略、排队消息发送方式及权限控制。',
  'Interface Layout': '界面布局',
  'Knowledge Work': '知识工作',
  'Simplified interface for research, writing, and everyday tasks.':
    '专为研究、写作及日常任务打造的精简界面。',
  'Software Engineering': '软件工程',
  'Full interface for coding, developer tools, and managing agents.':
    '包含编程、开发者工具及智能体管理的完整界面。',
  'Project 4K': 'Project 4K',
  'Project 4K interface without developer tooling.':
    '不包含开发者工具的 Project 4K 精简界面。',
  Default: '默认',
  'The full developer experience.': '完整的开发者体验。',

  // === Settings: General -> Permissions ===
  Permissions: '权限',
  'Configure what the agent can do in local and remote conversations.':
    '配置智能体在本地及远程会话中可执行的操作。',
  'Learn more': '了解更多',
  'This computer': '此电脑',
  'This Computer': '此电脑',
  Remote: '远程',
  'Controls the actions the agent can take.': '控制智能体可执行的本地操作。',
  'Controls permissions for remote conversations.': '控制远程会话的权限级别。',
  Advanced: '高级',
  'Permission preset': '权限预设',
  'Security preset': '安全预设',
  'Permission Settings': '权限设置',
  'Local Permissions': '本地权限',
  'Permission Details': '权限详情',
  'Terminal & Tooling Permissions': '终端与工具权限',
  'Tool permissions': '工具权限',
  'Tool Permissions': '工具权限',
  'File Permissions': '文件权限',
  'Network Permissions': '网络权限',
  'Terminal Commands': '终端命令',
  'Commands Outside Sandbox': '沙盒外命令',
  'MCP Tools': 'MCP 工具',
  'File reads': '文件读取',
  'File writes': '文件写入',
  'Read URLs': '读取 URL',
  'Terminal commands': '终端命令',
  'Commands outside sandbox': '沙盒外命令',
  'MCP tools': 'MCP 工具',
  'File access rules': '文件访问规则',
  'Network access rules': '网络访问规则',
  'Allow/deny agent read access to specific files or directories.':
    '允许或拒绝智能体读取特定文件或目录。',
  'Allow/deny agent write access to specific files or directories.':
    '允许或拒绝智能体写入特定文件或目录。',
  'Allow/deny agent read access to specific URLs or domains.':
    '允许或拒绝智能体访问特定 URL 或域名。',
  'Allow/deny specific terminal commands.': '允许或拒绝特定的终端命令。',
  'Allow/deny agent command execution outside the sandbox.':
    '允许或拒绝智能体在沙盒外执行命令。',
  'External tools the agent can call via Model Context Protocol.':
    '智能体可通过 MCP (模型上下文协议) 调用的外部工具。',
  'Configure allowed and denied paths for file reads and writes.':
    '配置文件读写允许与禁止的路径规则。',
  'Configure allowed and denied URLs for reading.':
    '配置允许和禁止读取的 URL 规则。',
  'Configure allowed terminal commands.': '配置允许执行的终端命令。',
  'Configure allowed commands outside the sandbox.':
    '配置允许在沙盒外执行的命令。',
  'Configure external tools via Model Context Protocol.':
    '通过模型上下文协议 (MCP) 配置外部工具权限。',
  'Outside of folders file access policy': '工作目录外文件访问策略',
  'Configures how the agent tries to access files outside of its working folders.':
    '配置智能体访问工作目录之外文件时的权限策略。',
  'Enable sandbox mode': '启用沙盒模式',
  'Restricts agent tools to a secure, isolated local sandbox.':
    '将智能体工具限制在安全隔离的本地沙盒中运行。',
  'Enable terminal sandbox': '启用终端沙盒',
  'Run terminal commands with sandbox restrictions.':
    '在沙盒限制环境下运行终端命令。',
  'Command setup script': '命令初始化脚本',
  'A shell setup script run before every command the agent executes.':
    '智能体每次执行命令前运行的 Shell 初始化脚本。',
  'Terminal command auto execution': '终端命令自动执行',
  'Controls whether terminal commands require your approval before running.':
    '控制终端命令运行前是否需要您的确认。',
  'Note: A change to this setting will only apply to new messages sent to the agent. In-progress responses will use the previous setting value.':
    '注意：此设置的更改仅对新发送给智能体的消息生效，正在进行的回复仍沿用旧设置。',
  'Always Proceed': '始终自动执行',
  'Proceed in Sandbox': '沙盒内自动执行',
  'Request Review': '每次询问确认',
  'The agent never asks for confirmation before executing terminal commands (except those in the Deny list). This provides the agent with the maximum ability to operate over long periods without intervention, but also has the highest risk of the agent executing an unsafe terminal command.':
    '除拒绝列表外，智能体执行终端命令前绝不询问确认。此模式赋予智能体最高的连续自主运行能力，但存在执行危险命令的风险。',
  'Terminal commands automatically proceed inside the sandbox. A command that needs to leave the sandbox proceeds only if an agent judges it reversible, and otherwise requests review.':
    '终端命令在沙盒内自动执行；如需脱离沙盒，仅当智能体判定操作可逆时自动执行，否则请求您确认。',
  'The agent always asks for confirmation before executing terminal commands (except those in the Allow list).':
    '除允许列表外，智能体每次执行终端命令前都会请求您确认。',
  'Terminal command automatically proceeds if the command runs inside the sandbox. Otherwise, it requests review.':
    '若终端命令在沙盒内运行则自动执行，否则请求您确认。',
  Turbo: '极速 (Turbo)',
  Auto: '自动',
  Ask: '询问',
  Safe: '安全',
  Review: '审查',
  Manual: '手动',

  // === Settings: General -> Input Box & Workspaces ===
  'Input Box': '输入框',
  'Queued messages': '排队消息',
  'Configure when follow-up messages are sent.': '配置后续追加消息的发送时机。',
  Queue: '排队等待',
  'Send Immediately': '立即发送',
  'Interrupt the agent and send immediately.': '中断当前智能体执行并立即发送。',
  'Queue until after the current turn.': '排队等待当前回合完成后再发送。',
  'Enter to send': '按 Enter 发送',
  'Send messages with the keyboard\'s Enter key instead of starting a new line.':
    '按键盘 Enter 键直接发送消息，而非换行。',
  'Send message': '发送消息按键',
  'Choose which key sends a message in the chat composer.':
    '选择在聊天输入框中用于发送消息的快捷键。',
  'Keyboard shortcuts': '快捷键说明',
  'Press Enter to send, Shift+Enter for a new line.':
    '按 Enter 发送，按 Shift+Enter 换行。',
  'Press Ctrl+Enter to send, Enter for a new line.':
    '按 Ctrl+Enter 发送，按 Enter 换行。',
  'Press Cmd+Enter to send, Enter for a new line.':
    '按 Cmd+Enter 发送，按 Enter 换行。',
  'Enable Sounds for Agent': '启用智能体提示音',
  'Play a sound when your action is needed or the agent finishes.':
    '当需要您操作或智能体完成任务时播放提示音。',
  'Enable Notifications for Agent': '启用智能体系统通知',
  'Show system notifications when your action is needed or the agent finishes.':
    '当需要您操作或智能体完成任务时显示系统通知。',
  'New conversation button': '新建会话按钮行为',
  'Which workspace the New Conversation button and keyboard shortcut start you in.':
    '点击新建会话按钮或使用快捷键时默认进入的工作区。',
  Workspaces: '工作区',
  'Default workspace VCS': '默认工作区版本控制 (VCS)',
  'VCS used when creating a new workspace, including workspaces generated based off your initial prompt.':
    '创建新工作区（包括根据初始提示词生成的工作区）时默认使用的版本控制系统。',
  'Default Cog repository': '默认 Cog 仓库',
  'Default Cog branch / ref': '默认 Cog 分支 / 引用',
  'Sync JJ worktrees to head': '同步 JJ 工作树至最新提交 (HEAD)',
  'Sync newly created JJ worktrees to head when starting a conversation.':
    '启动会话时将新建的 JJ 工作树同步到 HEAD。',
  'Use full VCS clones for Best of N': 'Best of N 使用完整 VCS 克隆',
  'Use full Git clones for Best of N': 'Best of N 使用完整 Git 克隆',
  'Best of N': 'Best of N',
  Labs: '实验室',

  // === Settings: Application & Account ===
  'Advanced Settings': '高级设置',
  Updater: '更新器',
  'Automatic Check for Updates': '自动检查更新',
  'Automatically prompt you to restart the app when a new update is available. When disabled, you can check for updates manually from the app menu.':
    '有新版本可用时自动提示重启应用。关闭后您仍可通过应用菜单手动检查更新。',
  'Prevent Sleep': '防止系统休眠',
  'Prevent the computer from sleeping while the app is running.':
    '应用运行期间阻止计算机进入休眠状态。',
  'Keep In Menu Bar': '保持在菜单栏运行',
  'Keep the app accessible from the menu bar and running in the background when all windows are closed.':
    '关闭所有窗口后仍保留菜单栏入口并在后台继续运行。',
  'Remote Control': '远程控制',
  'Enable Remote Control': '启用远程控制',
  'Manage your conversations from the companion website.':
    '通过配套网页端远程管理您的会话。',
  Nickname: '设备昵称',
  'A nickname for identifying this application in the companion website. Changing this will restart the connection.':
    '用于在配套网页端识别此设备的名称，修改后将重启远程连接。',
  'Manage your plan, credentials, and general preferences.':
    '管理您的订阅方案、凭据及通用偏好设置。',
  'Remote Agents Data': '远程智能体数据',
  'Orchestrator Settings': '编排器设置',
  'Open in Remote Control': '在远程控制中打开',

  // === Settings: Appearance ===
  'Configure the agent\'s visual theme and display preferences.':
    '配置智能体的视觉主题与界面显示偏好。',
  Theme: '主题',
  Light: '浅色',
  Dark: '深色',
  System: '跟随系统',
  'Light Theme': '浅色主题',
  'Dark Theme': '深色主题',
  Contrast: '对比度',
  Font: '字体',
  'Font Size': '字号',
  Chat: '对话显示',
  'Conversation Steps': '对话步骤详情',
  'Choose how much detail is shown during a conversation.':
    '选择在对话过程中展示多少执行步骤细节。',
  Verbose: '详细',
  'Chat Layout': '对话布局',
  'Conversation Width': '对话区域宽度',
  'Configure the maximum width of the conversation panel.':
    '配置对话面板的最大显示宽度。',
  Narrow: '窄栏',
  Wide: '宽栏',
  Fill: '铺满',
  'Markdown Artifact Width': 'Markdown 文档宽度',
  'Configure the default width of markdown artifacts.':
    '配置 Markdown 产物文档的默认显示宽度。',
  'Context and Quota Indicator': '上下文与配额指示器',
  'Show how full the context window is next to the send button. Click it for a breakdown and to see your model quota.':
    '在发送按钮旁显示上下文窗口占用率，点击可查看详细构成与模型配额。',
  Terminal: '终端',
  'Terminal Placement': '终端位置',
  'Choose where terminal sessions appear.': '选择终端会话的显示位置。',
  'Side Panel': '侧边面板',
  'Bottom Panel': '底部面板',
  Accessibility: '辅助功能',
  'Custom Context Menus': '自定义右键菜单',
  'Replace the default browser right-click menu with quick actions.':
    '使用带快捷操作的菜单替代默认浏览器右键菜单。',
  'Screen Reader Mode': '屏幕阅读器模式',
  'Optimize the interface and terminal output for screen readers.':
    '针对屏幕阅读器优化界面及终端输出可读性。',

  // === Settings: Shortcuts ===
  'Manage your keybinding scheme and customize shortcuts in VS Code.':
    '管理按键绑定方案并在 VS Code 中自定义快捷键。',
  'Keyboard shortcuts for quick navigation and control.':
    '用于快速导航与控制的键盘快捷键。',
  'Keybinding Scheme': '按键绑定方案',
  'Choose between non-colliding VS Code defaults or standalone Antigravity chords.':
    '在无冲突的 VS Code 默认方案与独立 Antigravity 组合键方案之间选择。',
  'VS Code Default': 'VS Code 默认',
  'Antigravity (AGY) Style': 'Antigravity (AGY) 风格',
  'Customize Shortcuts': '自定义快捷键',
  'All active Antigravity shortcuts and user keybinding overrides are managed directly by VS Code.':
    '所有生效的 Antigravity 快捷键与自定义按键均由 VS Code 直接管理。',
  'Stop Editing': '完成编辑',
  'Edit Shortcut': '编辑快捷键',
  'Add Shortcut': '添加快捷键',
  'Remove Shortcut': '移除快捷键',
  'Reset to Default': '恢复默认',
  'Reset All to Defaults': '全部恢复默认',
  'Open File Search': '打开文件搜索',
  'Enter always submits. This adds a second shortcut.':
    'Enter 键始终用于发送，此项将额外添加第二快捷键。',
  'Add to Chat/Quote': '添加到对话 / 引用',
  'Pin / Unpin Conversation': '置顶 / 取消置顶会话',
  'Terminal: Select All': '终端：全选',
  'Open Conversation in New Tab': '在新标签页打开会话',

  // === Settings: Notifications & Voice ===
  'Manage your notification preferences.': '管理您的系统通知偏好设置。',
  Sound: '提示音',
  Volume: '音量',
  'Set the volume of agent sounds.': '调节智能体提示音的音量大小。',
  'System default': '系统默认',
  Microphone: '麦克风',
  'Input device for voice mode and dictation.':
    '用于语音模式和语音听写的音频输入设备。',
  'Save audio recordings': '保存录音文件',
  'Only stored on your machine.': '仅保存在您的本地设备中。',
  Recordings: '录音记录',
  'Delete all recordings?': '确定删除所有录音吗？',

  // === Settings: Models & Quota ===
  'Models & Usage': '模型与用量',
  'Model Quota': '模型配额',
  'Manage your model quota and credits.': '管理您的模型配额与额度点。',
  'Refresh quota and credits data': '刷新配额与额度数据',
  'No quota information available.': '暂无配额信息。',
  Plan: '订阅方案',
  'Your Plan:': '当前方案:',
  'Plan:': '方案:',
  'Model Credits': '模型额度 (Credits)',
  'Enable AI Credit Overages': '启用 AI 超额额度消费',
  'Available AI Credits:': '可用 AI 额度:',
  'See Activity': '查看明细',
  'Get More AI Credits': '获取更多 AI 额度',
  'When toggled on, Antigravity will use your AI credits to fulfill model requests once you\'re out of model quota. Antigravity will always use your model quota first before using AI credits.':
    '开启后，当模型配额耗尽时，Antigravity 将使用您的 AI 额度响应请求。Antigravity 仍会始终优先使用模型配额。',
  'For Antigravity Business consumption options, see':
    '如需了解 Antigravity Business 的消费方案，请参阅',
  documentation: '文档',
  'Orchestrator Settings': '编排器设置',
  'Choose the models Orchestrator uses. A larger, smarter orchestrator model with a faster, cheaper executor gives high quality for fewer tokens.':
    '选择编排器使用的模型。更强大的编排器搭配更快更省的执行器，可在消耗更少 Token 的同时获得更高质量。',
  'Orchestrator Model': '编排器模型',
  'Plans the work, makes design decisions, and reviews the result. Pick a top-tier model. You can also pick one per conversation from the Orchestrator row in the model menu.':
    '负责规划任务、制定设计决策并审查结果。建议选择旗舰模型；您也可以在模型菜单的 Orchestrator 行中为单个会话单独指定。',
  'Executor Model': '执行器模型',
  'Carries out the plan: searches, edits, builds, and tests. Pick a faster, cheaper model.':
    '负责执行计划：搜索、编辑、构建与测试。建议选择速度更快、成本更低的模型。',
  'Gemini Models': 'Gemini 模型',
  'Claude and GPT models': 'Claude 与 GPT 模型',
  'Weekly Limit Remaining': '每周配额剩余',
  'Five Hour Limit Remaining': '5 小时配额剩余',
  '5-Hour Limit Remaining': '5 小时配额剩余',
  Quota: '配额',
  'Token Usage': 'Token 用量',
  'Modified in': '修改于',

  // === Settings: Browser ===
  'Configure built-in browser, link opening, and browser subagent preferences.':
    '配置内置浏览器、链接打开方式及浏览器子智能体偏好设置。',
  'Open Links In': '默认打开链接方式',
  'Choose where links open by default when clicked.':
    '选择点击链接时默认在何处打开。',
  'Built-in Browser': '内置浏览器',
  'External Browser': '外部浏览器',
  'Enable Browser Agent': '启用浏览器智能体',
  'Let the agent open URLs, read web pages, and interact with browser content. This gives the agent access to important (and often critical) knowledge and methods of validation, but any browser integration does increase exposure to external malicious parties for security exploits.':
    '允许智能体打开 URL、读取网页并与页面内容交互。这能让智能体获取关键信息并完成验证测试，但浏览器集成也会增加暴露于外部恶意页面风险的可能。',
  'Browser Javascript Execution Policy': '浏览器 JavaScript 执行策略',
  'Controls whether the agent can run custom JavaScript to automate complex browser actions.':
    '控制智能体是否可运行自定义 JavaScript 来自动化复杂浏览器操作。',
  Disabled: '已禁用',
  'Block all browser JavaScript execution.': '阻止所有浏览器 JavaScript 脚本执行。',
  'Prompt for approval before running browser scripts.':
    '运行浏览器脚本前先请求您的批准。',
  'Allow full browser script execution without prompting.':
    '允许直接执行所有浏览器脚本而无需确认。',
  'Browser Subagent': '浏览器子智能体',
  'Browser Actuation Rules': '浏览器操作规则',
  'Browser Actuation Permissions': '浏览器操作权限',
  'Browsing Data': '浏览数据',
  'Clear Browsing Data?': '确定清除浏览数据吗？',
  'Clear history, cookies and site data from the built-in browser, or manage cookies for each site.':
    '清除内置浏览器的历史记录、Cookie 与站点数据，或按站点单独管理 Cookie。',
  'Cookies by Site': '按站点管理 Cookie',
  'Search sites...': '搜索站点...',
  'Browsing History': '浏览历史',
  'Download Location': '下载保存位置',
  'Download files': '文件下载权限',
  'Allow/deny agent browser file downloads from specific sites.':
    '允许或拒绝智能体通过浏览器从特定站点下载文件。',
  'Execute URLs': '可执行 URL',
  'Allow/deny agent browser actuation access to specific URLs.':
    '允许或拒绝智能体浏览器对特定 URL 进行自动化操作。',
  'Organization Allowed Domains (Read-Only)': '组织允许的域名（只读）',

  // === Settings: Customizations, Hooks, MCP, Developer, Running ===
  Skills: '技能 (Skills)',
  Rules: '规则 (Rules)',
  Plugins: '插件 (Plugins)',
  'Custom Agents': '自定义智能体',
  'Customize Global Skills': '自定义全局技能',
  'Default Customizations': '默认自定义配置',
  'Include Jetski Default Customizations': '包含 Jetski 默认自定义配置',
  'Include default customizations, such as default skills.':
    '包含默认自定义配置（例如内置默认技能）。',
  'When enabled, the agent will include default customizations, including default skills.':
    '启用后，智能体将自动加载内置默认自定义配置及默认技能。',
  Hooks: '钩子 (Hooks)',
  'Manage Hooks': '管理钩子',
  'Configure hooks that run on agent lifecycle events.':
    '配置在智能体生命周期事件触发时运行的钩子。',
  'Add Hook Card': '添加钩子',
  'Delete Hook': '删除钩子',
  'Delete Handler': '删除处理器',
  'New hook name': '新钩子名称',
  'All tools (*)': '所有工具 (*)',
  'Hook will trigger if any tool is executed.': '执行任意工具时均会触发此钩子。',
  'Hook will only trigger if the tool name matches run_command.':
    '仅当工具名为 run_command 时触发此钩子。',
  'Hook will only trigger if the tool name matches run_command or view_file.':
    '仅当工具名为 run_command 或 view_file 时触发此钩子。',
  'Browser tools (browser_.*)': '浏览器工具 (browser_.*)',
  'Hook will only trigger if the tool name starts with browser_.':
    '仅当工具名以 browser_ 开头时触发此钩子。',
  'MCP Servers': 'MCP 服务器',
  'Installed MCP Servers': '已安装 MCP 服务器',
  'Add MCP Servers': '添加 MCP 服务器',
  'Refresh MCP servers': '刷新 MCP 服务器',
  'Search MCP servers by name': '按名称搜索 MCP 服务器',
  'Build With Google Plugins': 'Build With Google 插件',
  'Browse and enable plugins from the Build With Google catalog.':
    '从 Build With Google 目录浏览并启用插件。',
  'Developer-only tools. These settings do not affect other users.':
    '仅限开发者使用的工具，这些设置不会影响其他用户。',
  'Print telemetry to the console': '向控制台输出遥测日志',
  'Override feature environment': '覆盖功能特性环境',
  'Operating System': '操作系统',
  'Host Environment': '宿主环境',
  'User Type': '用户类型',
  'Background tasks and terminals agents left running, across all conversations.':
    '跨所有会话查看智能体正在后台运行的任务和终端。',
  'Configure workspace-specific permissions, resources, and customizations.':
    '配置当前工作区专属的权限、资源及自定义项。',
  'Settings Unavailable': '设置暂不可用',
  'Danger Zone': '危险操作区',
  'GitHub Permissions': 'GitHub 权限',
  'Manage fine-grained permissions for GitHub.':
    '管理 GitHub 的精细化访问权限。',
  'GitHub Policies': 'GitHub 策略',
  'Configure GitHub access policies.': '配置 GitHub 访问策略。',
  'Google Drive': 'Google 云端硬盘',
  'Upload Files': '上传文件',

  // === Common Actions & Placeholders ===
  Refresh: '刷新',
  Save: '保存',
  Cancel: '取消',
  Delete: '删除',
  Edit: '编辑',
  Add: '添加',
  Remove: '移除',
  Confirm: '确认',
  Reset: '重置',
  Apply: '应用',
  Done: '完成',
  Back: '返回',
  Next: '下一步',
  Continue: '继续',
  Options: '选项',
  Manage: '管理',
  Upgrade: '升级',
  'Sign Out': '退出登录',
  'Sign out': '退出登录',
  'Sign In': '登录',
  'Sign in': '登录',
  Stop: '停止',
  Copy: '复制',
  Copied: '已复制',
  Clear: '清除',
  Browse: '浏览',
  Enable: '启用',
  Disable: '禁用',
  Enabled: '已启用',
  Install: '安装',
  Uninstall: '卸载',
  Search: '搜索',
  'Search...': '搜索...',
  'Filter resources...': '筛选资源...',
  'Enter tool name or server...': '输入工具名或服务器名...',
  'Paste auth code': '粘贴授权码',
  'Paste code': '粘贴代码',
  'e.g., /path/to/file': '例如：/path/to/file',
  'e.g., https://example.com': '例如：https://example.com',
  'e.g., npm test': '例如：npm test',
  'e.g., curl': '例如：curl',
  'e.g., example.com': '例如：example.com',
  Yes: '是',
  No: '否',
};

// Ordered from most specific to least specific.
const PREFIX_RULES = [
  ['Plugin Operation Error:', '插件操作错误:'],
  ['MCP Configuration Error:', 'MCP 配置错误:'],
  ['MCP Install Error:', 'MCP 安装错误:'],
  ['Available AI Credits: ', '可用 AI 额度: '],
  ['Your Plan: ', '当前方案: '],
  ['Project ID: ', '项目 ID: '],
  ['Modified in ', '修改于 '],
  ['Version ', '版本 '],
  ['Plan: ', '方案: '],
];

// Serialized regex definitions so widget.js can inject them cleanly into browser JS.
const PATTERN_RULES = [
  {
    source: '^(\\d+)\\s+projects?$',
    flags: '',
    replace: '$1 个项目',
  },
  {
    source: '^Showing\\s+(\\d+)\\s+of\\s+(\\d+)$',
    flags: 'i',
    replace: '显示 $1 / $2',
  },
  {
    source: '^When toggled on,\\s*(.+?)\\s+will use your AI credits to fulfill model requests once you\'re out of model quota\\.\\s*\\1\\s+will always use your model quota first before using AI credits\\.$',
    flags: '',
    replace: '开启后，当模型配额耗尽时，$1 将使用您的 AI 额度响应请求。$1 仍会始终优先使用模型配额。',
  },
  {
    source: '^You have used some of your weekly limit, it will fully refresh in (.+?)\\.?$',
    flags: 'i',
    replace: '您已使用部分每周配额，将在 $1 后完全刷新。',
    localizeUnits: true,
  },
  {
    source: '^You have used all of your weekly limit, it will fully refresh in (.+?)\\.?$',
    flags: 'i',
    replace: '您已耗尽每周配额，将在 $1 后完全刷新。',
    localizeUnits: true,
  },
  {
    source: '^You have used some of your (?:5-hour|five[- ]hour) limit, it will fully refresh in (.+?)\\.?$',
    flags: 'i',
    replace: '您已使用部分 5 小时配额，将在 $1 后完全刷新。',
    localizeUnits: true,
  },
  {
    source: '^You have used all of your (?:5-hour|five[- ]hour) limit, it will fully refresh in (.+?)\\.?$',
    flags: 'i',
    replace: '您已耗尽 5 小时配额，将在 $1 后完全刷新。',
    localizeUnits: true,
  },
];

export {
  EXACT_ZH_MAP,
  PREFIX_RULES,
  PATTERN_RULES,
};
