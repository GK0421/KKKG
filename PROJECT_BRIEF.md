# 客栈夜雨 (Inn at Dusk) — Project Brief

> Generated 2026-06-05 by Hermes for the GameForgeLab workstream.
> Project: AGF Wuxia Dialogue 01 — 文字冒险 / Visual Novel, 武侠题材.
> Style: 古龙式留白 + 独白 + 0 战斗 + 沉默选择.

---

## 1. Identity

- **Project name (working)**: 客栈夜雨 / Inn at Dusk
- **Engine target**: Web (vanilla JS + Canvas) — AGF default
- **Genre**: Visual Novel / 文字冒险 (武侠)
- **Art style**: 程序化渐变 + 几何剪影 + 中文字体排版。**零外部图片**。**零 image-gen API**。
- **Visual decisions**:
  - `genre`: visual-novel
  - `animation_richness`: lite（只有文字淡入 / 字幕逐字显示 / 雨丝下落）
  - `module_style`: simple（AGF script-tag 加载）
  - `combat_style`: none
  - `narration_style`: 古龙式（短句 + 留白 + 独白）
- **剧本调性 (writer's intent)**:
  - 江湖已远。一个未具名的剑客，在暮色的山间客栈停留一夜。
  - 雨声 + 酒 + 偶遇 + 三段自己说给自己听的话。
  - 没有任何打斗；所有的"对决"都在心里。
  - 关键选择是"要不要打破沉默"——大多数时候，不说话比说话更重。
- **Out of scope**: 战斗、复杂分支树（只 1 个真实分支点 + 1 个结局）、3D、2D 角色立绘、动画语音。

## 2. Hard constraints (NON-NEGOTIABLE)

1. **不修改 AGF 上游**。所有工作限制在 `games/wuxia-dialogue-01/`。
2. **不引入任何第三方游戏引擎 / npm 依赖**。纯 vanilla JS + Canvas。
3. **不调用任何 image-gen API**。所有"画面"由 procedural gradient + 文字 + 几何剪影构成。
4. **不写入明文 token / API key / .env**。`.gitignore` 拦截。
5. **不把任务提示词写入正式项目文档**。README 与 PR 描述以剧本与运行说明为主体。
6. **剧本必须真 ~1 万字**。填充模板 + 真叙事骨架，不允许用 `// TODO: 后续填` 之类的占位。
7. **诚实声明**：作者不是古龙；剧本调性**近似**古龙（短句、留白、独白），不保证达到原著文笔密度。
8. **不写 `console.error`**。`console.warn` 仅允许用于用户输入的"静默回退"。

## 3. 源布局

```
wuxia-dialogue-01/
├── PROJECT_BRIEF.md          # 本文件
├── README.md                 # 公开运行说明
├── progress.json             # 执行状态
├── package.json              # dev 脚本
├── .gitignore
├── index.html                # 入口 (540x960 portrait, 文字优先)
├── styles.css                # 中文衬线字体栈 + 阅读节奏
├── data/
│   ├── script.json           # ~1 万字剧本（场景 / 对话 / 分支 / 回忆）
│   ├── scenes.json           # 场景定义（背景 / 滤镜 / 雨强度 / BGM）
│   ├── characters.json       # 角色卡（名字 / 身份 / 说话风格 / 心境）
│   └── choices.json          # 选择点定义（触发条件 / 选项 / 跳转）
├── src/
│   ├── constants.js          # VIEW, COLORS, FONT, ANIM_TIMING
│   ├── state.js              # 全局 state
│   ├── dom.js                # canvas + ctx
│   ├── assets.js             # procedural:// 短路（v1 已就位，复制）
│   ├── config.js             # 加载 scenes / characters / choices
│   ├── input.js              # 键盘 + 触屏（点击 / 长按）
│   ├── audio.js              # 程序化雨声 + 风铃声（WebAudio）
│   ├── typography.js         # 文字逐字显示 + 自动换行 + 留白节奏
│   ├── renderer.js           # 场景背景 + 角色剪影 + 雨丝
│   ├── choices.js            # 渲染选择 UI + 处理选择
│   ├── memory.js             # 回忆碎片 / 物品 / 关键选择记录
│   ├── script.js             # 推进剧本、状态机
│   ├── scene.js              # 切换场景（背景 / 滤镜 / BGM）
│   ├── hud.js                # 顶部场景名 / 进度点 / 提示
│   └── game.js               # boot + 主循环
├── tests/
│   └── smoke.sh              # 静态资源 200 校验
└── assets/                   # 占位
    ├── maps/
    ├── sprites/
    └── props/
```

## 4. 文本驱动架构

`data/script.json` 是**唯一**剧本来源。结构：

```json
{
  "scenes": [
    {
      "id": "scene_01",
      "title": "上山",
      "ambient": "rain_light",
      "lines": [
        { "type": "narration", "text": "雨是黄昏时落下的。" },
        { "type": "narration", "text": "山路只剩一条。" },
        { "type": "dialog", "speaker": "无名剑客", "text": "我得找个地方歇脚。" }
      ],
      "next": "scene_02"
    }
  ],
  "memories": [
    {
      "id": "mem_01",
      "trigger": "scene_02:line:5",
      "title": "那年春天",
      "lines": [ "..." ]
    }
  ],
  "branch_points": [
    {
      "id": "choice_01",
      "at": "scene_03:end",
      "question": "她抬头看你。你要说什么？",
      "options": [
        { "label": "「姑娘也是来避雨的？」", "next": "scene_04" },
        { "label": "「……」（沉默）", "next": "scene_05" },
        { "label": "「茶凉了。我帮你续。」", "next": "scene_06" }
      ]
    }
  ]
}
```

`type` 取值：
- `narration` —— 旁白（无名字，居中或偏左，灰白）
- `dialog` —— 对话（带 speaker）
- `inner` —— 独白（不带 speaker，但用斜体或更小字号，区别于旁白）
- `pause` —— 留白（500-1500ms 静默，只显示环境音 / 雨声）
- `memory` —— 回忆片段（淡入淡出 + 旧纸色滤镜 + 斜体）

`memory` 与 `branch_points` 是两个 **触发层**。memory 是**自动**触发（读到某行时自动浮现），branch_points 是**玩家选择**触发。

## 5. 视觉系统

### 配色（procedural）
- 雨夜山景：`#1a2030` → `#0a0d18` 渐变
- 客栈内景：`#2a1f15` → `#0d0a08` 渐变（油灯黄 `#d9a85a` 点缀）
- 回忆片段：`#3a2a1a` → `#1a0f0a` + 旧纸纹理（Canvas2D noise）

### 字体栈
- 衬线优先（中文古风）：
  ```css
  font-family: "Songti SC", "STSong", "Noto Serif CJK SC", "FangSong", "STFangsong", serif;
  ```
- 旁白：18px
- 对话：22px
- 独白：18px 斜体
- 标题：28px 加粗

### 节奏
- 逐字显示速度：45ms / 字（中文）
- 整段显示完后的"按任意键继续"提示：闪烁 1.2s 周期
- 场景切换淡入淡出：600ms
- 回忆片段：300ms 渐入 + 800ms 持续 + 400ms 渐出

## 6. 交互

| 操作 | 键盘 | 触屏 |
|---|---|---|
| 推进对话 / 跳过逐字 | Space / Enter / ↓ | 点屏幕下半 |
| 显示选择 UI | 选项出现时点对应按钮 | 同左 |
| 暂停 | Esc | 长按 1s |

`Space` 在逐字显示中按下 = **立即显示完整本行**；在本行已显示完后 = **推进到下一行**。

## 7. 验收门 (HARD)

1. `python -m http.server 5180` 起得来
2. `tests/smoke.sh` 38+ 个文件全 200
3. 浏览器打开后 0 红色 console 错误
4. 标题屏 → 第一场景 → 第一段独白 → 第一个选择点 → 至少 1 个分支结局
5. 剧本字符数 ≥ 9000（按 char 计算，包括标点）
6. Git 状态干净
7. PR 创建（或诚实标注阻塞）

## 8. 文笔诚实声明

剧本由 LLM 创作，模仿古龙式（短句、留白、独白、雨夜客栈意象），
**不**声称达到真古龙文笔密度。
所有对话与旁白均可由用户在 `data/script.json` 直接修改 — AGF 数据驱动设计的好处是
改文本不动代码。

## 9. 流程（与 v1 一致）

阶段 1：环境检查 ✅（沿用 v1）
阶段 2：剧本 + 场景 + 角色定义（**本回合**）
阶段 3：src 框架（用 v1 副本 + 删减 + 替换）
阶段 4：smoke + 修复
阶段 5：git init + main + feature/wuxia-dialogue-v1 + push
阶段 6：验收 + 最终报告
