export type EventMap = Record<string, any>;

type EventKey<T extends EventMap> = string & keyof T;

export type EventHandler<E> = (value: E) => void;
export type EventDisconnect = () => void;
export type EventListener<E> = (handler: EventHandler<E>) => EventDisconnect;

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

    let listeners: (typeof handler)[];

    let maybeListeners = this.listeners[event];

    if (maybeListeners) {
      listeners = maybeListeners;
    } else {
      listeners = [];
      this.listeners[event] = listeners;
    }

    listeners.push(handler);

    return () => {
      let index = listeners.indexOf(handler);
      if (index != -1) {
        listeners.splice(index, 1);
      }
    };
  }

  once<E extends EventKey<T>>(
    event: E,
    handler: EventHandler<T[E]>
  ): EventDisconnect {
    let disconnect = this.on(event, (value) => {
      handler(value);
      disconnect();
    });

    return disconnect;
  }

  protected emit<E extends EventKey<T>>(event: E, value: T[E]) {
    (this.listeners[event] || []).forEach((handler) => {
      handler(value);
    });
  }
}
