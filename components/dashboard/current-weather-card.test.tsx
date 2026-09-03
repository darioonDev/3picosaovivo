import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CurrentWeatherCard } from "./current-weather-card";
import type { CurrentConditions } from "@/providers/weather/weather-provider";

const CONDITIONS: CurrentConditions = {
  observedAt: "2026-09-03T13:20:00.000Z",
  temperatureC: 18.6,
  humidityPct: 87,
  windSpeedKmh: 14,
  windDirection: "NE",
  pressureHpa: 892,
  rainMmPerHour: 0,
  visibilityKm: 12,
  solarRadiationWm2: 420,
};

describe("CurrentWeatherCard", () => {
  it("renders the observed metrics and marks them as simulated", () => {
    render(<CurrentWeatherCard conditions={CONDITIONS} />);

    expect(screen.getByText("Condições atuais")).toBeInTheDocument();
    expect(screen.getByText("18.6")).toBeInTheDocument();
    expect(screen.getByText("87%")).toBeInTheDocument();
    expect(screen.getByText("14 km/h NE")).toBeInTheDocument();
    expect(screen.getByText("892 hPa")).toBeInTheDocument();
    expect(screen.getByText(/observado \(simulado\)/)).toBeInTheDocument();
  });

  it("hides the solar radiation tile when the reading is unavailable", () => {
    render(
      <CurrentWeatherCard conditions={{ ...CONDITIONS, solarRadiationWm2: null }} />
    );

    expect(screen.queryByText("Radiação solar")).not.toBeInTheDocument();
  });
});
