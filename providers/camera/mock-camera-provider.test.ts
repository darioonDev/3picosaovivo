import { describe, expect, it } from "vitest";
import { MockCameraProvider } from "./mock-camera-provider";

describe("MockCameraProvider", () => {
  it("returns a connected status with a resolution label", async () => {
    const provider = new MockCameraProvider();
    const status = await provider.getStatus();

    expect(status.connected).toBe(true);
    expect(status.connectionStatus).toBe("online");
    expect(status.resolution).toMatch(/simulado/);
  });

  it("returns the 7 configured presets with exactly one active", async () => {
    const provider = new MockCameraProvider();
    const presets = await provider.getPresets();

    expect(presets).toHaveLength(7);
    expect(presets.filter((preset) => preset.status === "active")).toHaveLength(1);
  });

  it("gotoPreset activates the target and deactivates the rest", async () => {
    const provider = new MockCameraProvider();

    const updated = await provider.gotoPreset("pico-maior");

    expect(updated.status).toBe("active");
    const presets = await provider.getPresets();
    const active = presets.filter((preset) => preset.status === "active");
    expect(active).toHaveLength(1);
    expect(active[0].id).toBe("pico-maior");
  });

  it("gotoPreset rejects an unknown preset id", async () => {
    const provider = new MockCameraProvider();
    await expect(provider.gotoPreset("nao-existe")).rejects.toThrow();
  });

  it("never returns a real stream URL", async () => {
    const provider = new MockCameraProvider();
    await expect(provider.getStreamUrl()).resolves.toBeNull();
  });
});
