declare global {
  interface Window {
    initStrudel: () => Promise<void>;

    evaluate: (code: string, autoplay?: boolean) => void;
  }
}

export {};
