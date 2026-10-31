// Self-check for the Idea Machine data + picker. Run: node src/lib/ideas.check.ts
import assert from "node:assert/strict";
import { BRANCHES, IDEAS, ideasFor, pickNext } from "./ideas.ts";

// Every branch × level has enough ideas for the reels to feel varied
for (const b of BRANCHES) for (const l of ["mini", "major"] as const) {
  assert.ok(ideasFor(b, l).length >= 6, `${b}/${l} has only ${ideasFor(b, l).length} ideas`);
}
// Unique ids, titles short enough for a reel, final-year ideas are the harder ones
assert.equal(new Set(IDEAS.map((i) => i.id)).size, IDEAS.length, "duplicate idea id");
for (const i of IDEAS) assert.ok(i.title.length <= 26, `title too long: ${i.title}`);
for (const i of IDEAS.filter((x) => x.level === "major")) assert.ok(i.difficulty >= 4, `major idea too easy: ${i.title}`);

const pool = ideasFor("ECE", "mini");
const cur = pool[0];
// Never repeats the current idea
for (let n = 0; n < 200; n++) assert.notEqual(pickNext(pool, cur, [])!.id, cur.id);
// Prefers ideas not seen recently
const others = pool.filter((i) => i.id !== cur.id);
const recent = others.slice(0, -1).map((i) => i.id);
assert.equal(pickNext(pool, cur, recent)!.id, others.at(-1)!.id);
// Nothing else to pick → null
assert.equal(pickNext([cur], cur, []), null);

console.log(`ideas ok: ${IDEAS.length} ideas`);
// Most ideas are hardware (IoT / embedded)
const hw = IDEAS.filter((i) => i.category === "iot").length;
assert.ok(hw / IDEAS.length >= 0.75, `only ${hw}/${IDEAS.length} ideas are hardware`);
console.log(`hardware ideas: ${hw}/${IDEAS.length}`);
