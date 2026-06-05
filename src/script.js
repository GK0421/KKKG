// 客栈夜雨 — 剧本推进器
// 维护当前 scene / 当前 line 索引 / 状态机

const script = {
  current: null,      // 当前 scene 对象
  currentEnding: null,// 当前 ending 对象
  lineIndex: 0,       // 当前 scene 行索引
  mode: "scene"       // "scene" | "branch" | "ending" | "title"
};

function loadScene(sceneId) {
  const sceneDef = state.scriptData.scenes.find((s) => s.id === sceneId);
  if (!sceneDef) {
    // 可能是 ending
    const ending = state.scriptData.endings.find((e) => e.id === sceneId);
    if (ending) {
      loadEnding(ending);
      return;
    }
    throw new Error("Scene not found: " + sceneId);
  }
  script.current = sceneDef;
  script.lineIndex = 0;
  script.currentEnding = null;
  script.mode = "scene";

  // 应用 scene 配置
  const sceneCfg = state.scenesConfig.scenes[sceneDef.id] || state.scenesConfig.defaults;
  state.currentSceneCfg = sceneCfg;
  // 雨
  if (sceneCfg.rain && sceneCfg.rain.enabled) {
    initRain(sceneCfg.rain.density || 0.5);
  } else {
    rainState.drops = [];
  }
  // 重置 typography
  typography.completed = [];
  typography.active = null;
  typography.pauseT = 0;
  // 推第一行
  advanceLine();
}

function loadEnding(endingObj) {
  script.current = null;
  script.currentEnding = endingObj;
  script.lineIndex = 0;
  script.mode = "ending";
  const sceneCfg = state.scenesConfig.scenes[endingObj.id] || state.scenesConfig.defaults;
  state.currentSceneCfg = sceneCfg;
  if (sceneCfg.rain && sceneCfg.rain.enabled) {
    initRain(sceneCfg.rain.density || 0.5);
  } else {
    rainState.drops = [];
  }
  typography.completed = [];
  typography.active = null;
  advanceLine();
}

function advanceLine() {
  if (script.mode === "scene" || script.mode === "ending") {
    const lines = script.mode === "ending" ? script.currentEnding.lines : script.current.lines;
    if (script.lineIndex >= lines.length) {
      // 场景/ending 结束
      if (script.mode === "scene") {
        // 检查 branch_point
        if (script.current.branch_point) {
          const bp = state.scriptData.branch_points.find((b) => b.id === script.current.branch_point);
          if (bp) {
            script.mode = "branch";
            startChoice(bp);
            return;
          }
        }
        // 检查 memories_at_end
        if (script.current.memories_at_end && script.current.memories_at_end.length > 0) {
          const memId = script.current.memories_at_end.shift(); // 一次一个
          const memContent = state.scriptData.memories.find((m) => m.id === memId);
          if (memContent && triggerMemory(memId, memContent)) {
            // 记忆触发中,玩家跳过 or 时间到了再推进
            return;
          }
        }
        // 直接进 next
        if (script.current.next) {
          loadScene(script.current.next);
          return;
        }
        // 无 next: 回到标题
        returnToTitle();
        return;
      } else {
        // ending 结束: 回到标题
        returnToTitle();
        return;
      }
    }
    const line = lines[script.lineIndex];
    script.lineIndex += 1;
    if (line.type === "pause") {
      typography.pauseT = line.ms || 1000;
      // pause 类型不占用 active, 让 dt 推进
      return;
    }
    pushLine(line);
  }
}

function playerAdvance() {
  if (isMemoryActive()) {
    // 跳过回忆
    memory.phase = 3;
    memory.phaseT = 0;
    return;
  }
  if (script.mode === "branch") {
    // 等待玩家选
    return;
  }
  if (isInPause()) {
    // 跳过 pause
    typography.pauseT = 0;
    return;
  }
  if (isTyping()) {
    completeActiveLine();
    return;
  }
  if (isWaitingForAdvance()) {
    commitActiveLine();
    // 立即推下一行 (但如果上一行 commit 完需要重置, pushLine 已经清空)
    advanceLine();
  }
}

function playerPickChoice(index) {
  if (script.mode !== "branch" || !choices.active) return;
  const nextId = pickOption(index);
  if (nextId) loadScene(nextId);
}

function returnToTitle() {
  script.mode = "title";
  script.current = null;
  script.currentEnding = null;
  // 标题屏: 复用 scene_01 配置作为静态背景
  const sceneCfg = state.scenesConfig.scenes.scene_01 || state.scenesConfig.defaults;
  state.currentSceneCfg = sceneCfg;
  if (sceneCfg.rain && sceneCfg.rain.enabled) {
    initRain(sceneCfg.rain.density || 0.5);
  } else {
    rainState.drops = [];
  }
}
