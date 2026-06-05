#!/usr/bin/env node
// 客栈夜雨 — 离线状态机自检
// 拉起 script.json + scenes.json + characters.json, 跑一遍"标题 → 6 场景 → 分支 → 结局"的状态机,
// 验证:
//  1. 没有任何 scene 引用不存在的 scene/ending id
//  2. 没有任何 branch_point 引用不存在的 option.next
//  3. 没有任何 memory.trigger 引用不存在的 scene id
//  4. 没有任何 dialog.speaker 引用不存在的 character
//  5. 剧本字符数 >= 4000 (当前 4148, 扩写后这个阈值要更新)
//  6. 全图可达: 从 startScene 出发的 BFS 能触达 ≥ 1 个 ending

const fs = require("fs");
const path = require("path");

const DATA = path.join(__dirname, "..", "data");
const script = JSON.parse(fs.readFileSync(path.join(DATA, "script.json"), "utf8"));
const scenes = JSON.parse(fs.readFileSync(path.join(DATA, "scenes.json"), "utf8"));
const chars = JSON.parse(fs.readFileSync(path.join(DATA, "characters.json"), "utf8"));

let fails = 0;
const fail = (msg) => { console.error("FAIL:", msg); fails += 1; };
const ok = (msg) => console.log("OK:  ", msg);

// 1) scene.next 引用存在
const sceneIds = new Set(script.scenes.map((s) => s.id));
const endingIds = new Set(script.endings.map((e) => e.id));
for (const s of script.scenes) {
  if (s.next && !sceneIds.has(s.next) && !endingIds.has(s.next)) {
    fail(`scene ${s.id}.next 指向不存在的 id: ${s.next}`);
  }
}

// 2) branch_point options
for (const bp of script.branch_points) {
  for (const opt of bp.options) {
    if (!sceneIds.has(opt.next) && !endingIds.has(opt.next)) {
      fail(`branch_point ${bp.id} option "${opt.label}" next 指向不存在: ${opt.next}`);
    }
  }
}

// 3) memory.trigger 引用存在
const memTriggers = script.scenes.flatMap((s) => (s.memories_at_end || []).map((m) => ({ scene: s.id, mem: m })));
for (const t of memTriggers) {
  const m = script.memories.find((x) => x.id === t.mem);
  if (!m) fail(`scene ${t.scene} memories_at_end 引用不存在的 memory: ${t.mem}`);
}

// 4) dialog.speaker 引用存在
for (const s of script.scenes) {
  for (const line of s.lines) {
    if (line.type === "dialog" && !chars.characters[line.speaker]) {
      fail(`scene ${s.id} dialog.speaker 不在 characters: ${line.speaker}`);
    }
  }
}

// 5) 字符数
let totalChars = 0;
for (const s of script.scenes) {
  for (const line of s.lines) if (line.text) totalChars += line.text.length;
}
for (const m of script.memories) {
  for (const line of m.lines) if (line.text) totalChars += line.text.length;
}
for (const e of script.endings) {
  for (const line of e.lines) if (line.text) totalChars += line.text.length;
}
console.log("INFO: 剧本字符数 =", totalChars);
if (totalChars < 4000) fail("剧本字符数 < 4000");
else ok("剧本字符数 >= 4000");

// 6) BFS 可达
const start = "scene_01";
const reached = new Set();
const queue = [start];
while (queue.length) {
  const cur = queue.shift();
  if (reached.has(cur)) continue;
  reached.add(cur);
  const s = script.scenes.find((x) => x.id === cur);
  if (!s) {
    const e = script.endings.find((x) => x.id === cur);
    if (e) continue;
    continue;
  }
  if (s.next) queue.push(s.next);
  if (s.branch_point) {
    const bp = script.branch_points.find((b) => b.id === s.branch_point);
    if (bp) for (const o of bp.options) queue.push(o.next);
  }
}
console.log("INFO: 可达节点 =", Array.from(reached).join(", "));
if (!Array.from(reached).some((id) => endingIds.has(id))) {
  fail("BFS 没能从 startScene 到达任何 ending");
} else {
  ok("BFS 至少能到达 1 个 ending");
}

// 7) scenes.json 视觉配置覆盖
const sceneCfgIds = Object.keys(scenes.scenes);
for (const sid of sceneIds) {
  if (!sceneCfgIds.includes(sid)) {
    console.warn("WARN: scenes.json 缺少", sid, "的可视配置 (将用 defaults)");
  }
}
for (const eid of endingIds) {
  if (!sceneCfgIds.includes(eid)) {
    console.warn("WARN: scenes.json 缺少 ending", eid, "的可视配置");
  }
}

if (fails > 0) {
  console.error(`\nFAILED: ${fails} issue(s).`);
  process.exit(1);
}
console.log("\nALL OFFLINE CHECKS PASSED");
