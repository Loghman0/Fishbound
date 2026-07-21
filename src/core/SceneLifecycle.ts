/**
 * SceneLifecycle — tiny helper that tracks listeners, tweens, timers, particles,
 * and arbitrary destroy callbacks for a Phaser scene and runs them on shutdown.
 * Prevents leaks across scene restarts.
 */
import Phaser from "phaser";

type Unbind = () => void;

export class SceneLifecycle {
  private unbinds: Unbind[] = [];
  constructor(private scene: Phaser.Scene) {
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.flush());
    scene.events.once(Phaser.Scenes.Events.DESTROY, () => this.flush());
  }

  /** Register an event listener that will be removed on shutdown. */
  on<E extends Phaser.Events.EventEmitter>(
    emitter: E,
    event: string,
    handler: (...args: any[]) => void,
    context?: unknown,
  ): void {
    emitter.on(event, handler, context);
    this.unbinds.push(() => emitter.off(event, handler, context));
  }

  /** Register an arbitrary teardown callback. */
  add(fn: Unbind): void { this.unbinds.push(fn); }

  /** Track an object with a .destroy() method. */
  track(obj: { destroy: () => void } | undefined): void {
    if (!obj) return;
    this.unbinds.push(() => { try { obj.destroy(); } catch { /* noop */ } });
  }

  private flush(): void {
    for (const fn of this.unbinds.splice(0)) {
      try { fn(); } catch (e) { console.warn("[SceneLifecycle] teardown error", e); }
    }
  }
}
