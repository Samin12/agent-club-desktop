import type { BrowserWindow } from 'electron';

type Window = Pick<
  BrowserWindow,
  'isDestroyed' | 'isFullScreen' | 'isSimpleFullScreen' | 'setFullScreen' | 'setSimpleFullScreen'
>;

/** Own only the fullscreen change made by Jarvis, restoring the user's prior mode on exit. */
export function createJarvisFullscreen(getWindow: () => Window | null, platform: string) {
  let restore: (() => void) | undefined;
  return (active: boolean): void => {
    if (!active) {
      restore?.();
      restore = undefined;
      return;
    }
    if (restore) return;
    const window = getWindow();
    if (!window || window.isDestroyed()) return;
    // Simple fullscreen avoids a macOS Space transition and supports immediate exit.
    const simple = platform === 'darwin' && !window.isFullScreen();
    const previous = simple ? window.isSimpleFullScreen() : window.isFullScreen();
    const set = (value: boolean) => {
      if (window.isDestroyed()) return;
      if (simple) window.setSimpleFullScreen(value);
      else window.setFullScreen(value);
    };
    restore = () => set(previous);
    set(true);
  };
}
