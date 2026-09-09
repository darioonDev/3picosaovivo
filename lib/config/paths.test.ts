import path from "node:path";
import { describe, expect, it } from "vitest";
import { isInsideDeployDir } from "./resolve";

/**
 * The state file must live outside the application directory: a deploy
 * replaces that directory wholesale, so anything saved inside it is lost on
 * the next publish. The admin panel warns when it isn't, and this pins the
 * check that decides.
 */
describe("isInsideDeployDir", () => {
  const app = path.resolve(process.cwd());

  it("flags the default location, which sits inside the app", () => {
    expect(isInsideDeployDir(path.join(app, "settings.json"))).toBe(true);
    expect(isInsideDeployDir(path.join(app, "data", "state.json"))).toBe(true);
    expect(isInsideDeployDir(app)).toBe(true);
  });

  it("accepts a path outside the app", () => {
    expect(isInsideDeployDir("/tmp/somewhere/state.json")).toBe(false);
    expect(isInsideDeployDir(path.join(app, "..", "state.json"))).toBe(false);
  });

  it("does not mistake a sibling whose name shares the prefix", () => {
    // "<app>-data" starts with "<app>" as a string but is not inside it.
    expect(isInsideDeployDir(`${app}-data/state.json`)).toBe(false);
  });

  it("compares paths that differ only in Unicode normalisation", () => {
    // macOS returns decomposed paths from process.cwd() while an env var
    // arrives composed, so "Três" can differ byte for byte while printing
    // identically. Without normalising, the check silently returns false and
    // the warning never fires.
    const decomposed = path.join(app, "settings.json").normalize("NFD");
    const composed = path.join(app, "settings.json").normalize("NFC");
    expect(isInsideDeployDir(decomposed)).toBe(true);
    expect(isInsideDeployDir(composed)).toBe(true);
  });
});
