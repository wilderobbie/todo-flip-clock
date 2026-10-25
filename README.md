# Todo — 翻页时钟 & 番茄时钟桌面应用

一款基于 Electron 的跨平台桌面效率工具，内置**翻页时钟**与**番茄时钟**两大功能，支持中英文切换、明暗主题、沉浸全屏与番茄数据统计。显示名为 **Todo**，项目包名 `todo-flip-clock`。

- 仓库：<https://github.com/wilderobbie/todo-flip-clock>
- 当前版本：`1.0.0`

---

## 一、核心功能

### 主界面
- 左侧可折叠侧边栏（`cubic-bezier` 缓动动画），折叠后仅保留扁平化图标并显示 tooltip
- 中间以**楷体**轮播格言警句（每 60 秒随机切换 + 淡入动画）
- 点击左上角 Logo 返回主界面

### 设置界面
- **通用**：简体中文 / English 全量切换（分段控件，即时生效并持久化）
- **外观**：全黑 / 全白 / 跟随系统 三主题（自动监听系统 `prefers-color-scheme`）

### 翻页时钟
- 计分器式 3D 翻页动画（上下翻板 + 拟物音效），支持 12/24 小时制
- 右侧滑出设置面板：翻页比例（0~100，同步缩放卡片与数字）、数字亮度（0~100）、翻页声音开关、日期显示开关
- 右下角隐含式设置 / 全屏按钮（悬停显现），全屏后覆盖侧边栏与标题栏

### 番茄时钟
- SVG 圆环进度动画 + 开始/暂停、重置、记录中断
- 计时预设：标准番茄（4×25′ 休 5′）、深度工作（4×50′ 休 10′）、冲刺模式（8×15′ 休 3′），另可自定义专注/休息时长与轮数
- 今日统计：已完成番茄数、专注时长、中断时长（跨天自动清零）
- 成就徽章：毅力之星、专注达人、效率专家（达成即点亮）
- 面板底部「时钟比例」滑块（0~100）实时缩放圆环

---

## 二、技术栈

| 层面 | 技术 |
|---|---|
| 运行时 | Electron `37.2.5`（内含 Chromium + Node.js，用户无需另行安装） |
| 界面 | 原生 HTML5 / CSS3 / JavaScript（ES2020，无框架、无构建打包步骤） |
| 样式方案 | CSS 自定义变量（主题切换）+ CSS3 3D 变换（翻页动画） |
| 图标 | lucide SVG 图标，构建期合并为**同文档 SVG Sprite** 内联进 `index.html` |
| 数据存储 | `localStorage`（设置偏好与今日统计） |
| 打包分发 | electron-builder `26.x`（NSIS 安装包 / asar / maximum 压缩） |
| 资源处理脚本 | Node (`.mjs`) 与 Python + Pillow |

> 应用**零运行时第三方依赖**（`dependencies` 为空），上述工具均为 devDependency。

---

## 三、环境依赖与前置条件

| 项目 | 要求 |
|---|---|
| 操作系统（开发） | Windows 10/11 x64（macOS、Linux 可做构建但未内置 CI 验证） |
| 操作系统（运行） | Windows 10 及以上，x64；不支持 32 位与 Win7/8.1 |
| Node.js | **≥ 20**（推荐使用 Node 22.x，仓库在 22.22.2 下验证通过） |
| npm | 随 Node 附带即可 |
| 其他运行时依赖 | **无**（不需要 Python/.NET/VC++ 运行库，Python 仅用于生成图标素材） |

> 网络不畅时使用镜像：`ELECTRON_MIRROR` 与 `ELECTRON_BUILDER_BINARIES_MIRROR`（见下方 环境变量表）。

---

## 四、安装与启动

```bash
# 1. 克隆仓库
git clone https://github.com/wilderobbie/todo-flip-clock.git
cd todo-flip-clock

# 2. 安装依赖（若下载 Electron 二进制缓慢，使用国内镜像）
npm install
# npm install --registry=https://registry.npmmirror.com \
#   --electron_mirror=https://npmmirror.com/mirrors/electron/

# 3. 启动应用
npm start
```

> **Windows / 终端集成环境注意**：若环境变量 `ELECTRON_RUN_AS_NODE=1`，Electron 会被当作纯 Node 运行而报 `Cannot read properties of undefined (reading 'whenReady')`。PowerShell 启动前先去除该变量，或使用开发者工具打开。

---

## 五、可用命令与脚本

### npm scripts（`package.json`）

| 命令 | 作用 | 产物 |
|---|---|---|
| `npm start` | 开发模式启动应用 | — |
| `npm run pack` | 仅生成免安装运行目录 | `dist/win-unpacked/` |
| `npm run dist` | 打包 Windows NSIS 安装包 | `dist/Setup-Todo-1.0.0.exe` |
| `npm run dist:mac` | 打包 macOS DMG | `dist/*.dmg` |
| `npm run dist:linux` | 打包 Linux AppImage | `dist/*.AppImage` |

打包命令（含镜像）：

```bash
ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/ \
ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/ \
npm run dist
```

> 打包前请先关闭正在运行的 Todo 实例，否则 `dist/` 中的文件被占用会导致构建失败。

### 资源处理脚本（`tools/`）

| 脚本 | 命令 | 用途 |
|---|---|---|
| `make_icons.py` | `python tools/make_icons.py` | 由原图抠除深色背景并生成圆角透明 PNG（16~512）与多分辨率 `icon.ico`（BMP 条目） |
| `build_sprite.mjs` | `node tools/build_sprite.mjs` | 将 `assets/icons/ui/*.svg` 合并为 Sprite 注入 `index.html` |
| `embed_logo.mjs` | `node tools/embed_logo.mjs` | 将 `icon_48.png` 转为 data URI 内嵌，规避 `file://` 下图片/UO 加载被拦截 |

改动 `assets/icons/ui/` 或替换 Logo 后，**必须**依次重跑 `embed_logo.mjs` 与 `build_sprite.mjs`。

---

## 六、目录结构

```
todo-flip-clock/
├─ index.html              # 界面骨架（含内联 SVG Sprite 与 Logo data URI）
├─ main.js                 # 主进程：窗口创建、自绘标题栏 IPC、任务栏/Dock 图标
├─ preload.js              # 预加载：通过 contextBridge 暴露窗口控制 API
├─ renderer.js             # 应用主控：路由、i18n、主题、侧边栏、全屏
├─ flipclock.js            # 翻页时钟：翻页动画、设置面板、音效
├─ pomodoro.js             # 番茄时钟：状态机、统计、徽章、比例滑块
├─ styles.css              # 全量样式（主题变量、动画、布局）
├─ package.json            # 依赖与脚本
├─ electron-builder.json   # 打包配置（appId / icon / NSIS / asar）
├─ assets/
│  ├─ icons/               # 应用图标（ico + 多尺寸 png）与 ui/*.svg（23 个）
│  └─ sounds/flip.wav      # 拟物翻页音效
├─ tools/                  # 资源处理脚本（见上表）
└─ dist/                   # 构建产物（已在 .gitignore 中忽略）
```

---

## 七、配置项与环境变量

### 环境变量

| 变量 | 取值示例 | 说明 |
|---|---|---|
| `ELECTRON_MIRROR` | `https://npmmirror.com/mirrors/electron/` | 加速 Electron 二进制下载 |
| `ELECTRON_BUILDER_BINARIES_MIRROR` | `https://npmmirror.com/mirrors/electron-builder-binaries/` | 加速 NSIS/winCodeSign 构建件下载 |
| `ELECTRON_ENABLE_LOGGING` | `1` | 调试用：让渲染进程日志输出到终端 |
| `ELECTRON_RUN_AS_NODE` | **必须为空** | 若被设为 `1` 应用无法启动（见第四节注意事项） |
| `NODE_OPTIONS` | 建议清空 | 非空时打包版启动会打印 `Most NODE_OPTIONs are not supported` 信息 |

### 应用配置（存于 `localStorage`）

| 键名 | 内容 | 示例值 |
|---|---|---|
| `todo.lang` | 界面语言 | `"zh"` \| `"en"` |
| `todo.theme` | 主题模式 | `"dark"` \| `"light"` \| `"system"` |
| `todo.flipclock` | 翻页时钟：`format`/`ratio`/`brightness`/`sound`/`showDate` | `{"format":"24","ratio":50,"brightness":100,"sound":true,"showDate":true}` |
| `todo.pomodoro.cfg` | 番茄计时：`preset`/`focus`/`rest`/`rounds`/`ringRatio` | `{"preset":"standard","focus":25,"rest":5,"rounds":4,"ringRatio":50}` |
| `todo.pomodoro.stats` | 今日统计（跨天自动重置） | `{"date":"2026-10-25","pomodoros":0,"focusSeconds":0,"interruptedSeconds":0,"interrupts":0}` |

清除数据：开发者工具控制台执行 `localStorage.clear()` 后重启。

### 打包配置要点（`electron-builder.json`）

| 字段 | 值 | 说明 |
|---|---|---|
| `appId` | `com.todo.flipclock` | 与 `main.js` 中 `setAppUserModelId` 保持一致 |
| `productName` | `Todo` | 决定 exe 名、安装目录与快捷方式名 |
| `asar` | `true` | 源码与资源打包为单个 asar 归档 |
| `compression` | `maximum` | 安装包 91MB（免安装目录 294MB） |
| `win.icon` / `mac.icon` | `assets/icons/icon.ico` / `icon.png` | 需含 256×256 尺寸 |
| `win.target` | `nsis`（x64） | 非一键安装、可改目录、生成桌面与开始菜单快捷方式 |

---

## 八、快速上手示例

完成一个标准番茄钟（25 分钟专注 + 5 分钟休息）：

1. 启动应用 `npm start`，主界面点击左侧「番茄时钟」
2. 右下角（悬停显现）点击**设置**图标 → 计时设置选择 **标准番茄** → 面板自动应用
3. 关闭侧边栏（右上角 ×），点击 **开始** → 圆环开始倒计时，状态显示「专注中」
4. 需要中断时点 **记录中断**：该段已用时长计入「中断时长」并自动暂停
5. 25 分钟结束后自动进入 5 分钟休息（圆环转为绿色），完成后回到下一轮专注
6. 再次打开设置侧栏，查看**今日统计**（番茄数 / 专注时长 / 中断时长）与徽章点亮状态

切换深色：侧边栏「设置」→ 外观 → **全黑**；切换英文：通用 → **English**，界面文案即时切换。

---

## 九、构建与分发

```bash
taskkill //IM Todo.exe //F        # 确保无实例占用
npm run dist
```

产物位于 `dist/`：

- `Setup-Todo-1.0.0.exe`（92MB）——双击安装，**分发只需此文件**
- `win-unpacked/Todo.exe`——免安装目录，可整目录压缩为 zip
- `.blockmap` / `builder-debug.yml`——差分更新与调试用，无需分发

> 安装包未做代码签名，对方首次运行可能被 SmartScreen 拦截，点「更多信息 → 仍要运行」即可。

---

## 十、贡献指南

1. Fork 本仓库 → 新建分支：`git checkout -b feat/your-feature`
2. 提交信息建议遵循 Conventional Commits：`feat:`、`fix:`、`docs:`、`chore:`
3. 改动 UI 图标或 Logo 后，务必重跑 `tools/embed_logo.mjs` 与 `tools/build_sprite.mjs`
4. 提交前自查：
   - `node --check` 通过（`npm start` 无控制台报错）
   - 四个界面均冒烟通过
   - `npm run dist` 可成功出包
5. 发起 Pull Request，说明变更内容与截图佐证

---

## 十一、许可证

本项目采用 **MIT License**，版权归 `zy_001` 所有。完整的 `LICENSE` 文件待补充（当前仅在 `package.json` 中声明 `"license": "MIT"`）。

---

## 说明 / 假设

以下内容为基于现有代码的推断，尚未由仓库所有者确认：

1. **Node 版本要求**：代码未声明 `engines` 字段，「≥ 20」为基于 Electron 37 与已验证环境（Node 22.22.2）的推断，非硬性校验。
2. **macOS / Linux 打包**：`electron-builder.json` 中已配置 `dmg` / `AppImage` 目标，但**仅 Windows 产物经过实测**；其余平台未做验证。
3. **脚本运行方式**：`tools/make_icons.py` 依赖 Python + Pillow（非项目依赖），`build_sprite.mjs` / `embed_logo.mjs` 需 Node ≥ 20；三者在 Node 22.22.2 下验证通过。
4. **音频素材许可**：`assets/sounds/flip.wav` 来源于开源项目 `jasonkunc/flippin-klock`（其许可证为 GPLv3）。若计划闭源分发，建议替换为自有或明确可商用的素材。
5. **UI 图标来源**：`assets/icons/ui/*.svg` 取自 lucide（`unpkg.com/lucide-static@0.469.0`），遵循 ISC 协议。
6. **无自动化测试与 Linter**：仓库当前不含测试框架与 ESLint 配置，验证以手动冒烟 + `node --check` 为准。
7. **仓库截图缺失**：README 未附界面截图；如需，可将主界面、翻页时钟、番茄时钟、设置四张图放入 `docs/screenshots/` 并在简介处引用。
8. **数据持久化假设**：番茄统计按「当日」维度存储在 `localStorage`，未做多日历史，跨时区以 ISO 日期字符串判断（`toISOString().slice(0,10)`，UTC 基准）。
