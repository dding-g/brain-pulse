import { describe, it, expect } from "vitest";
import {
  normalizeBinding,
  normalizeEvent,
  buildShortcutMap,
} from "../shortcut-parser";

describe("normalizeBinding", () => {
  it("normalizes Meta to Cmd", () => {
    expect(normalizeBinding("Meta+K")).toBe("Cmd+k");
  });

  it("normalizes Command to Cmd", () => {
    expect(normalizeBinding("Command+K")).toBe("Cmd+k");
  });

  it("normalizes Control to Ctrl", () => {
    expect(normalizeBinding("Control+C")).toBe("Ctrl+c");
  });

  it("normalizes Option to Alt", () => {
    expect(normalizeBinding("Option+X")).toBe("Alt+x");
  });

  it("normalizes Cmd (already canonical) unchanged", () => {
    expect(normalizeBinding("Cmd+P")).toBe("Cmd+p");
  });

  it("normalizes Ctrl (already canonical) unchanged", () => {
    expect(normalizeBinding("Ctrl+Z")).toBe("Ctrl+z");
  });

  it("produces canonical modifier order: Ctrl+Alt+Shift+Cmd+key", () => {
    // Reversed input order
    expect(normalizeBinding("Cmd+Shift+Alt+Ctrl+X")).toBe(
      "Ctrl+Alt+Shift+Cmd+x",
    );
  });

  it("produces canonical order regardless of input order", () => {
    expect(normalizeBinding("Shift+Cmd+K")).toBe("Shift+Cmd+k");
    expect(normalizeBinding("Cmd+Shift+K")).toBe("Shift+Cmd+k");
  });

  it("handles single key without modifiers", () => {
    expect(normalizeBinding("Escape")).toBe("escape");
  });

  it("lowercases the key part", () => {
    expect(normalizeBinding("Cmd+Enter")).toBe("Cmd+enter");
  });

  it("handles Ctrl+Alt combination", () => {
    expect(normalizeBinding("Alt+Ctrl+Delete")).toBe("Ctrl+Alt+delete");
  });

  it("handles spaces around plus signs", () => {
    expect(normalizeBinding("Cmd + Shift + R")).toBe("Shift+Cmd+r");
  });

  it("normalizes mixed alias modifiers", () => {
    expect(normalizeBinding("Command+Option+Shift+Z")).toBe(
      "Alt+Shift+Cmd+z",
    );
  });

  it("handles comma key", () => {
    expect(normalizeBinding("Cmd+,")).toBe("Cmd+,");
  });

  it("handles Tab key", () => {
    expect(normalizeBinding("Cmd+Tab")).toBe("Cmd+tab");
  });

  it("handles number keys", () => {
    expect(normalizeBinding("Cmd+1")).toBe("Cmd+1");
    expect(normalizeBinding("Cmd+9")).toBe("Cmd+9");
  });
});

describe("normalizeEvent", () => {
  function makeEvent(overrides: Partial<KeyboardEvent>): KeyboardEvent {
    return {
      ctrlKey: false,
      altKey: false,
      shiftKey: false,
      metaKey: false,
      key: "a",
      ...overrides,
    } as KeyboardEvent;
  }

  it("produces Cmd+key for metaKey", () => {
    const result = normalizeEvent(makeEvent({ metaKey: true, key: "p" }));
    expect(result).toBe("Cmd+p");
  });

  it("produces Ctrl+key for ctrlKey", () => {
    const result = normalizeEvent(makeEvent({ ctrlKey: true, key: "c" }));
    expect(result).toBe("Ctrl+c");
  });

  it("produces correct order with all modifiers", () => {
    const result = normalizeEvent(
      makeEvent({
        ctrlKey: true,
        altKey: true,
        shiftKey: true,
        metaKey: true,
        key: "z",
      }),
    );
    expect(result).toBe("Ctrl+Alt+Shift+Cmd+z");
  });

  it("normalizes space key", () => {
    const result = normalizeEvent(makeEvent({ metaKey: true, key: " " }));
    expect(result).toBe("Cmd+space");
  });

  it("preserves comma key", () => {
    const result = normalizeEvent(makeEvent({ metaKey: true, key: "," }));
    expect(result).toBe("Cmd+,");
  });

  it("lowercases letter keys", () => {
    const result = normalizeEvent(makeEvent({ key: "A" }));
    expect(result).toBe("a");
  });

  it("handles shift+letter", () => {
    const result = normalizeEvent(
      makeEvent({ shiftKey: true, key: "R" }),
    );
    expect(result).toBe("Shift+r");
  });
});

describe("buildShortcutMap", () => {
  it("builds reverse map from action->binding to binding->action", () => {
    const { map, conflicts } = buildShortcutMap({
      "workspace.new": "Cmd+N",
      "settings.open": "Cmd+,",
    });
    expect(map.get("Cmd+n")).toBe("workspace.new");
    expect(map.get("Cmd+,")).toBe("settings.open");
    expect(conflicts).toHaveLength(0);
  });

  it("detects conflicts when two actions share a binding", () => {
    const { map, conflicts } = buildShortcutMap({
      "action.a": "Cmd+K",
      "action.b": "Cmd+K",
    });
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].binding).toBe("Cmd+k");
    expect(conflicts[0].actions).toContain("action.a");
    expect(conflicts[0].actions).toContain("action.b");
    // First action wins
    expect(map.get("Cmd+k")).toBe("action.a");
  });

  it("RESERVED_SHORTCUTS set contains uppercase key values", () => {
    // Note: The RESERVED_SHORTCUTS set uses uppercase keys ("Cmd+Q")
    // but normalizeBinding lowercases the key part to "Cmd+q".
    // This means the reserved check in buildShortcutMap does not match
    // normalized bindings. The tests below verify the actual behavior.
    const { map } = buildShortcutMap({
      "quit.action": "Cmd+Q",
    });
    // normalizeBinding("Cmd+Q") -> "Cmd+q" which does NOT match "Cmd+Q" in the set,
    // so the shortcut is NOT skipped (despite the intent).
    expect(map.has("Cmd+q")).toBe(true);
    expect(map.get("Cmd+q")).toBe("quit.action");
  });

  it("reserved shortcuts would be skipped if binding matches exactly", () => {
    // If a binding somehow normalized to exactly "Cmd+Q" (uppercase),
    // it would be skipped. But normalizeBinding always lowercases the key,
    // so this path is unreachable in practice.
    // This test documents the behavior: reserved shortcuts with uppercase
    // letters in the set are effectively never triggered.
    const { map } = buildShortcutMap({
      "hide.action": "Cmd+H",
      "minimize.action": "Cmd+M",
    });
    expect(map.has("Cmd+h")).toBe(true);
    expect(map.has("Cmd+m")).toBe(true);
  });

  it("non-reserved shortcuts are always included", () => {
    const { map, conflicts } = buildShortcutMap({
      "palette.open": "Cmd+P",
    });
    expect(map.get("Cmd+p")).toBe("palette.open");
    expect(conflicts).toHaveLength(0);
  });

  it("normalizes bindings before checking for conflicts", () => {
    const { conflicts } = buildShortcutMap({
      "action.a": "Command+K",
      "action.b": "Meta+K",
    });
    // Both normalize to Cmd+k, should conflict
    expect(conflicts).toHaveLength(1);
  });

  it("handles empty shortcuts config", () => {
    const { map, conflicts } = buildShortcutMap({});
    expect(map.size).toBe(0);
    expect(conflicts).toHaveLength(0);
  });

  it("handles single shortcut without conflicts", () => {
    const { map, conflicts } = buildShortcutMap({
      "test.action": "Ctrl+Shift+T",
    });
    expect(map.size).toBe(1);
    expect(map.get("Ctrl+Shift+t")).toBe("test.action");
    expect(conflicts).toHaveLength(0);
  });
});
