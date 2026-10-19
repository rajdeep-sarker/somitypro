import { describe, expect, it } from "vitest";
import { runPreloadQueue } from "./preload";

describe("menu preload queue", () => {
  it("limits background reads to two concurrent requests and runs every task once", async () => {
    let active = 0;
    let peak = 0;
    const completed: number[] = [];
    await runPreloadQueue(Array.from({ length: 8 }, (_, index) => async () => {
      peak = Math.max(peak, ++active);
      await new Promise((resolve) => setTimeout(resolve, 2));
      active--;
      completed.push(index);
    }), new AbortController().signal);
    expect(peak).toBe(2);
    expect(completed.sort()).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it("does not start further work after logout cancels the queue", async () => {
    const controller = new AbortController();
    let calls = 0;
    await runPreloadQueue([
      async () => { calls++; controller.abort(); },
      async () => { calls++; },
    ], controller.signal, 1);
    expect(calls).toBe(1);
  });

  it("continues warming other menus when a speculative read fails", async () => {
    let completed = false;
    await runPreloadQueue([
      async () => { throw new Error("offline"); },
      async () => { completed = true; },
    ], new AbortController().signal, 1);
    expect(completed).toBe(true);
  });
});