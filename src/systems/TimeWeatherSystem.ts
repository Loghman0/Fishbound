/**
 * TimeWeatherSystem — in-game clock + weighted weather state machine.
 * Emits 'phase' and 'weather' on internal emitter and via global EventBus.
 */

import Phaser from "phaser";
import { DAY_LENGTH_SECONDS, TIME_PHASES, type TimePhase } from "../core/Constants";
import { WEATHER_TICK_MS, WEATHER_TRANSITIONS, DAILY_RESET_HOUR } from "../core/Balance";
import { EventBus } from "../core/EventBus";
import type { SaveSystem } from "./SaveSystem";

export type Weather = "clear" | "cloudy" | "rain" | "storm";

export interface ClockState {
  hours: number;
  phase: TimePhase;
  weather: Weather;
}

export class TimeWeatherSystem {
  readonly events = new Phaser.Events.EventEmitter();
  private weatherAcc = 0;
  private save?: SaveSystem;

  bind(save: SaveSystem): void { this.save = save; }

  update(deltaMs: number): void {
    if (!this.save) return;
    const s = this.save.state;
    const hoursPerMs = 24 / (DAY_LENGTH_SECONDS * 1000);
    const prevPhase = this.phaseFor(s.hours);
    const prevDay = s.day;
    s.hours = (s.hours + deltaMs * hoursPerMs);
    if (s.hours >= 24) {
      s.hours -= 24;
      s.day += 1;
    }
    // Daily reset
    if (
      (prevDay !== s.day) ||
      (s.lastDailyHour > DAILY_RESET_HOUR && s.hours >= DAILY_RESET_HOUR && s.hours < DAILY_RESET_HOUR + 1)
    ) {
      if (s.hours >= DAILY_RESET_HOUR && s.lastDailyHour < DAILY_RESET_HOUR) {
        s.caughtToday = 0;
      }
    }
    s.lastDailyHour = s.hours;

    const nextPhase = this.phaseFor(s.hours);
    if (nextPhase !== prevPhase) {
      this.events.emit("phase", nextPhase);
      EventBus.emit("phase:change", nextPhase);
    }

    this.weatherAcc += deltaMs;
    if (this.weatherAcc >= WEATHER_TICK_MS) {
      this.weatherAcc = 0;
      this.rollWeather();
    }
  }

  private rollWeather(): void {
    if (!this.save) return;
    const s = this.save.state;
    const transitions = WEATHER_TRANSITIONS[s.weather] ?? [["clear", 1]];
    const total = transitions.reduce((a, [, p]) => a + p, 0);
    let r = Math.random() * total;
    let next: Weather = s.weather;
    for (const [name, p] of transitions) {
      r -= p;
      if (r <= 0) { next = name as Weather; break; }
    }
    if (next !== s.weather) {
      s.weather = next;
      this.events.emit("weather", next);
      EventBus.emit("weather:change", next);
    }
  }

  setWeather(w: Weather): void {
    if (!this.save) return;
    this.save.state.weather = w;
    this.events.emit("weather", w);
    EventBus.emit("weather:change", w);
  }

  get state(): ClockState {
    const s = this.save?.state;
    const hours = s?.hours ?? 8;
    const weather = (s?.weather ?? "clear") as Weather;
    return { hours, phase: this.phaseFor(hours), weather };
  }

  phaseTint(): number {
    switch (this.state.phase) {
      case "dawn": return 0xffd9b8;
      case "day": return 0xffffff;
      case "dusk": return 0xffb27a;
      case "night": return 0x6a7ad1;
    }
  }

  private phaseFor(h: number): TimePhase {
    if (h < 6) return "night";
    if (h < 9) return "dawn";
    if (h < 18) return "day";
    if (h < 21) return "dusk";
    return "night";
  }

  formatted(): string {
    const h = Math.floor(this.state.hours);
    const m = Math.floor((this.state.hours - h) * 60);
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  }
}

export const ALL_PHASES = TIME_PHASES;
