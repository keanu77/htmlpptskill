import { test } from "node:test";
import assert from "node:assert/strict";
import { median } from "../src/stats.js";

test("median：奇數筆取中間", () => {
  assert.equal(median([1, 5, 9]), 5);
  assert.equal(median([7]), 7);
});

test("median：偶數筆取中間兩筆平均", () => {
  assert.equal(median([0, 100]), 50);
  assert.equal(median([1, 2, 3, 10]), 2.5);
});

test("median：沒有資料回傳 null", () => {
  assert.equal(median([]), null);
});
