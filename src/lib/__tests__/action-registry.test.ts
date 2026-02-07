import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  registerAction,
  unregisterAction,
  dispatchAction,
} from "../action-registry";

describe("action-registry", () => {
  // Since the module uses a module-level Map, we need to clean up between tests
  // by unregistering any actions we register
  const registeredActions: string[] = [];

  function registerAndTrack(name: string, handler: () => void) {
    registerAction(name, handler);
    registeredActions.push(name);
  }

  beforeEach(() => {
    // Clean up any previously registered actions
    for (const name of registeredActions) {
      unregisterAction(name);
    }
    registeredActions.length = 0;
  });

  describe("registerAction + dispatchAction", () => {
    it("fires the registered handler when dispatched", () => {
      const handler = vi.fn();
      registerAndTrack("test.fire", handler);

      const result = dispatchAction("test.fire");

      expect(result).toBe(true);
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("can register multiple different actions", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      registerAndTrack("action.one", handler1);
      registerAndTrack("action.two", handler2);

      dispatchAction("action.one");
      dispatchAction("action.two");

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it("dispatching one action does not fire other handlers", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      registerAndTrack("isolated.a", handler1);
      registerAndTrack("isolated.b", handler2);

      dispatchAction("isolated.a");

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).not.toHaveBeenCalled();
    });

    it("replaces handler when registering same action name again", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      registerAndTrack("replace.action", handler1);
      registerAndTrack("replace.action", handler2);

      dispatchAction("replace.action");

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it("can dispatch the same action multiple times", () => {
      const handler = vi.fn();
      registerAndTrack("multi.dispatch", handler);

      dispatchAction("multi.dispatch");
      dispatchAction("multi.dispatch");
      dispatchAction("multi.dispatch");

      expect(handler).toHaveBeenCalledTimes(3);
    });
  });

  describe("dispatchAction for unregistered action", () => {
    it("returns false for unregistered action", () => {
      const result = dispatchAction("nonexistent.action");
      expect(result).toBe(false);
    });

    it("returns false for empty string action name", () => {
      const result = dispatchAction("");
      expect(result).toBe(false);
    });
  });

  describe("unregisterAction", () => {
    it("removes the handler so dispatch returns false", () => {
      const handler = vi.fn();
      registerAction("remove.me", handler);

      // Verify it works before removal
      expect(dispatchAction("remove.me")).toBe(true);
      expect(handler).toHaveBeenCalledTimes(1);

      unregisterAction("remove.me");

      // After unregister, dispatch should return false
      const result = dispatchAction("remove.me");
      expect(result).toBe(false);
      expect(handler).toHaveBeenCalledTimes(1); // Not called again
    });

    it("does not throw when unregistering a non-existent action", () => {
      expect(() => unregisterAction("never.registered")).not.toThrow();
    });

    it("only removes the specified action, leaving others intact", () => {
      const handlerA = vi.fn();
      const handlerB = vi.fn();
      registerAndTrack("keep.this", handlerA);
      registerAction("remove.this", handlerB);

      unregisterAction("remove.this");

      expect(dispatchAction("keep.this")).toBe(true);
      expect(handlerA).toHaveBeenCalledTimes(1);
      expect(dispatchAction("remove.this")).toBe(false);
    });
  });
});
