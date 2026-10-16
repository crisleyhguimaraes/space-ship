export const WEATHER = {
  clearMin: 120,
  clearMax: 240,
  clouding: 30,
  rainMin: 90,
  rainMax: 150,
  storm: 60,
  clearing: 30,
  flashMinGap: 4,
  flashMaxGap: 12,
  settleRate: 0.12,
}

export type WeatherState = 'clear' | 'clouding' | 'rain' | 'storm' | 'clearing'
export type Wind = { x: number; z: number }
export type Weather = { state: WeatherState; remaining: number; clouds: number; rain: number; nextFlash: number; windAngle: number; wind: Wind }
export type WeatherFrame = { clouds: number; rain: number; flash: boolean; wind: Wind }

const NEXT: Record<WeatherState, WeatherState> = { clear: 'clouding', clouding: 'rain', rain: 'storm', storm: 'clearing', clearing: 'clear' }
const CLOUD_TARGET: Record<WeatherState, number> = { clear: 0.25, clouding: 0.8, rain: 0.95, storm: 1, clearing: 0.5 }
const RAIN_TARGET: Record<WeatherState, number> = { clear: 0, clouding: 0, rain: 0.7, storm: 1, clearing: 0.15 }
const WIND_STRENGTH: Record<WeatherState, number> = { clear: 0.4, clouding: 0.7, rain: 0.9, storm: 1.4, clearing: 0.6 }

export function createWeather(random = Math.random): Weather {
  const windAngle = random() * Math.PI * 2
  return { state: 'clear', remaining: duration('clear', random), clouds: 0.25, rain: 0, nextFlash: 0, windAngle, wind: { x: Math.cos(windAngle) * 0.4, z: Math.sin(windAngle) * 0.4 } }
}

export function stepWeather(w: Weather, dt: number, random = Math.random): WeatherFrame {
  w.remaining -= dt
  if (w.remaining <= 0) {
    w.state = NEXT[w.state]
    w.remaining = duration(w.state, random)
    if (w.state === 'rain') w.rain = Math.max(w.rain, 0.3)
    if (w.state === 'clear') w.rain = 0
    if (w.state === 'storm') w.nextFlash = gap(random)
  }
  const settle = 1 - Math.exp(-WEATHER.settleRate * dt)
  w.clouds += (CLOUD_TARGET[w.state] - w.clouds) * settle
  w.rain += (RAIN_TARGET[w.state] - w.rain) * settle
  if (w.state === 'clear') w.rain = 0

  let flash = false
  if (w.state === 'storm') {
    w.nextFlash -= dt
    if (w.nextFlash <= 0) {
      flash = true
      w.nextFlash = gap(random)
    }
  }

  w.windAngle += (random() - 0.5) * 0.3 * dt
  const strength = WIND_STRENGTH[w.state]
  w.wind.x += (Math.cos(w.windAngle) * strength - w.wind.x) * settle
  w.wind.z += (Math.sin(w.windAngle) * strength - w.wind.z) * settle
  return { clouds: w.clouds, rain: w.rain, flash, wind: w.wind }
}

function duration(state: WeatherState, random: () => number): number {
  switch (state) {
    case 'clear':
      return WEATHER.clearMin + random() * (WEATHER.clearMax - WEATHER.clearMin)
    case 'clouding':
      return WEATHER.clouding
    case 'rain':
      return WEATHER.rainMin + random() * (WEATHER.rainMax - WEATHER.rainMin)
    case 'storm':
      return WEATHER.storm
    case 'clearing':
      return WEATHER.clearing
  }
}

function gap(random: () => number): number {
  return WEATHER.flashMinGap + random() * (WEATHER.flashMaxGap - WEATHER.flashMinGap)
}
