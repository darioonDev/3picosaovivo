import { describe, expect, it } from "vitest";
import { MockForecastProvider } from "./mock-forecast-provider";

describe("MockForecastProvider", () => {
  it("returns 12 hourly points in chronological order", async () => {
    const provider = new MockForecastProvider();
    const hours = await provider.getHourlyForecast();

    expect(hours).toHaveLength(12);
    const timestamps = hours.map((point) => new Date(point.timestamp).getTime());
    expect(timestamps).toEqual([...timestamps].sort((a, b) => a - b));
  });

  it("returns 5 daily points starting with Hoje and Amanhã", async () => {
    const provider = new MockForecastProvider();
    const days = await provider.getDailyForecast();

    expect(days).toHaveLength(5);
    expect(days[0].label).toBe("Hoje");
    expect(days[1].label).toBe("Amanhã");
    for (const day of days) {
      expect(day.temperatureMaxC).toBeGreaterThanOrEqual(day.temperatureMinC);
    }
  });
});
