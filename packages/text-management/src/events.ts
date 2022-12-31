type EventMap = Record<string, any>;

type EventKey<T extends EventMap> = string & keyof T;

type EventHandler<E> = (value: E) => void;

type EventDisconnect = () => void;

export class EventEmitter<T extends EventMap> {
  private listeners: {
    [E in keyof EventMap]?: EventHandler<EventMap[E]>[];
  } = {};

  protected onListener: {
    [E in keyof EventMap]?: (event: EventHandler<EventMap[E]>) => void;
  } = {};

  on<E extends EventKey<T>>(
    event: E,
    handler: EventHandler<T[E]>
  ): EventDisconnect {
    let onListener = this.onListener[event];

    if (onListener) {
      onListener(handler);
    }

    let listeners: typeof handler[];

    let maybeListeners = this.listeners[event];

    if (maybeListeners) {
      listeners = maybeListeners;
    } else {
      listeners = [];
      this.listeners[event] = listeners;
    }

    listeners.push(handler);

    return () => {
      listeners.indexOf(handler);
    };
  }

  protected emit<E extends EventKey<T>>(event: E, value: T[E]) {
    (this.listeners[event] || []).forEach((handler) => {
      handler(value);
    });
  }
}
