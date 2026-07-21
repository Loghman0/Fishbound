/**
 * EventBus — a single shared Phaser event emitter used across systems
 * and scenes for cross-cutting concerns (catches, sells, area changes).
 */

import Phaser from "phaser";

export interface FishCaughtEvent {
  id: string;
  name?: string;
  rarity: string;
  weightKg: number;
  biome: string;
  value?: number;
  isLegendary?: boolean;
  isNewSpecies?: boolean;
  isRecord?: boolean;
  isHeaviest?: boolean;
  streak?: number;
}

export interface ShopSoldEvent { count: number; earned: number }
export interface AreaEnteredEvent { mapId: string }
export interface BaitCraftedEvent { id: string; qty: number }

export type GameEventName =
  | "fish:caught"
  | "fish:lost"
  | "shop:sold"
  | "area:entered"
  | "bait:crafted"
  | "skill:level"
  | "achievement:unlock"
  | "quest:complete"
  | "weather:change"
  | "phase:change";

class EventBusImpl extends Phaser.Events.EventEmitter {}
export const EventBus = new EventBusImpl();
