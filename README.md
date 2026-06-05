# 客栈夜雨 / Inn at Dusk

A browser-based, single-file, **visual novel** built on the
[Agent Game Forge (AGF)](https://github.com/0x0funky/agent-game-forge) framework conventions.

- 题材: 武侠
- 调性: 古龙式留白 + 独白 + 0 战斗
- 引擎: vanilla JS + Canvas 2D (no build step, no framework)
- 美术: 全部程序化 — 渐变背景 + 油灯 glow + 雨丝 + 旧纸 grain。**零图片, 零 image-gen API**。
- 文字: 中文衬线字体栈, 逐字显示, 自动换行, 留白节奏。
- 数据驱动: 全部剧本在 `data/script.json` 里, **改文本不动代码**。

## Quick start

```bash
cd games/wuxia-dialogue-01

# 任选其一:
python -m http.server 5180
# 或
npx --yes serve -l 5180 .
```

打开 <http://localhost:5180>

## Controls

| 操作 | 键盘 | 触屏 |
| --- | --- | --- |
| 推进对话 / 跳过逐字 | Space / Enter / ↓ | 点击屏幕 |
| 选择选项 | 1 / 2 / 3 | 点击选项按钮 |
| 开始 / 重启 | Space (在标题屏) | 点击屏幕 |

## Project status

- 剧本架构完整 (6 场景 + 4 回忆 + 1 分支 + 3 结局, 完整可玩)
- 剧本字符数: **4148 / 10000 (41.5%)** — 见 `WORDCOUNT_PROGRESS.md`
- 后续每轮对话会扩写剧本, 目标 ~1 万字

## File layout

```
wuxia-dialogue-01/
├── index.html
├── styles.css
├── package.json
├── PROJECT_BRIEF.md
├── WORDCOUNT_PROGRESS.md          # 剧本扩写计划
├── data/
│   ├── script.json                # ~1万字剧本 (当前 4148)
│   ├── scenes.json                # 场景视觉配置
│   ├── characters.json            # 角色卡
│   └── choices.json               # (保留,运行时从 script.json 读)
├── src/                           # 复用 mobile-prototype-01 框架
│   ├── constants.js               # 文字 + 颜色 + 节奏常量
│   ├── state.js, dom.js, assets.js, audio.js  # 复用 v1
│   ├── collision.js, particles.js, dialogue.js # 复用 v1 (备用)
│   ├── typography.js              # 逐字显示 + 换行
│   ├── renderer.js                # 背景 + 雨丝 + 旧纸
│   ├── choices.js                 # 选择点 UI
│   ├── memory.js                  # 回忆碎片
│   ├── script.js                  # 剧本推进
│   ├── text_area.js               # 文字主区
│   ├── hud.js                     # 顶部场景名 + 闪烁提示
│   ├── input.js                   # 键盘 + 触屏
│   └── game.js                    # boot + 主循环
├── assets/                        # 占位
└── tests/smoke.sh                 # 38+ 资源 HTTP 200 校验
```

## Honesty

- 剧本由 LLM 创作, 模仿古龙式 (短句 / 留白 / 独白 / 雨夜客栈意象).
- **不**声称达到真古龙文笔密度. 文本可由用户在 `data/script.json` 直接修改.
- 当前 4148 字, 目标 ~1 万字, 渐进扩写.

## Verification

```bash
bash tests/smoke.sh 5180
```

应该输出 `ALL N CHECKS PASSED`.
