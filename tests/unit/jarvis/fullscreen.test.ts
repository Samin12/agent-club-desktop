import { describe, expect, it, vi } from 'vitest';
import { createJarvisFullscreen } from '@/process/services/jarvis/fullscreen';

function window(full = false) {
  return {
    isDestroyed: () => false,
    isFullScreen: () => full,
    isSimpleFullScreen: () => false,
    setFullScreen: vi.fn(),
    setSimpleFullScreen: vi.fn(),
  };
}

describe('Jarvis immersive window', () => {
  it('restores a normal macOS window after repeated enter calls', () => {
    const win = window();
    const set = createJarvisFullscreen(() => win, 'darwin');
    set(true);
    set(true);
    set(false);
    expect(win.setSimpleFullScreen.mock.calls).toEqual([[true], [false]]);
  });
  it('preserves an already fullscreen window', () => {
    const win = window(true);
    const set = createJarvisFullscreen(() => win, 'darwin');
    set(true);
    set(false);
    expect(win.setFullScreen.mock.calls).toEqual([[true], [true]]);
    expect(win.setSimpleFullScreen).not.toHaveBeenCalled();
  });
  it('uses native fullscreen on Windows', () => {
    const win = window();
    const set = createJarvisFullscreen(() => win, 'win32');
    set(true);
    set(false);
    expect(win.setFullScreen.mock.calls).toEqual([[true], [false]]);
  });
  it('does not fail when the window closes before exiting', () => {
    const win = window();
    const set = createJarvisFullscreen(() => win, 'darwin');
    set(true);
    win.isDestroyed = () => true;
    expect(() => set(false)).not.toThrow();
    expect(win.setSimpleFullScreen).toHaveBeenCalledTimes(1);
  });
});
