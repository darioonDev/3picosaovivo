import { describe, expect, it } from "vitest";
import { MockWeatherStationProvider } from "./mock-weather-provider";

describe("MockWeatherStationProvider", () => {
  it("returns current conditions with the documented fields", async () => {
    const provider = new MockWeatherStationProvider();
    const conditions = await provider.getCurrentConditions();

    expect(conditions.temperatureC).toBeCloseTo(18.6);
    expect(conditions.humidityPct).toBe(87);
    expect(conditions.windDirection).toBe("NE");
    expect(typeof conditions.observedAt).toBe("string");
  });

  it("returns historical data sized for each range", async () => {
    const provider = new MockWeatherStationProvider();

    expect(await provider.getHistoricalData("24h")).toHaveLength(24);
    expect(await provider.getHistoricalData("7d")).toHaveLength(56);
    expect(await provider.getHistoricalData("30d")).toHaveLength(120);
  });

  it("is deterministic for the same range", async () => {
    const provider = new MockWeatherStationProvider();

    const first = await provider.getHistoricalData("24h");
    const second = await provider.getHistoricalData("24h");

    expect(first.map((point) => point.temperatureC)).toEqual(
      second.map((point) => point.temperatureC)
    );
  });
});
