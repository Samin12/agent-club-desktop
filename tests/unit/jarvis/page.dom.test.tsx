import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Jarvis from '@/renderer/pages/Jarvis';
import SiderJarvisEntry from '@/renderer/components/layout/Sider/SiderNav/SiderJarvisEntry';

const mocks = vi.hoisted(() => ({
  open: vi.fn(),
  fullscreen: vi.fn(() => Promise.resolve()),
  navigate: vi.fn(),
  desktop: vi.fn(() => true),
}));
vi.mock('@/common', () => ({
  ipcBridge: { jarvis: { open: { invoke: mocks.open }, fullscreen: { invoke: mocks.fullscreen } } },
}));
vi.mock('react-router-dom', () => ({
  useNavigate: () => mocks.navigate,
  useLocation: () => ({ state: { returnTo: '/assistants' } }),
}));
vi.mock('@renderer/utils/platform', () => ({ isElectronDesktop: mocks.desktop }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

beforeEach(() => {
  mocks.open.mockReset();
  mocks.fullscreen.mockClear();
  mocks.navigate.mockClear();
  mocks.desktop.mockReturnValue(true);
});

describe('Jarvis tab', () => {
  it('shows startup failure and opens the HUD after retry', async () => {
    mocks.open.mockRejectedValueOnce(new Error('Service unavailable'));
    mocks.open.mockResolvedValueOnce({ url: 'http://127.0.0.1:12345/#session=test' });
    render(<Jarvis />);
    await screen.findByRole('alert');
    fireEvent.click(screen.getByText('common.jarvis.retry'));
    const frame = await screen.findByTitle('common.jarvis.title');
    expect(frame.getAttribute('src')).toBe('http://127.0.0.1:12345/#session=test');
    expect(frame.getAttribute('sandbox')).not.toContain('allow-top-navigation');
  });

  it('does not start a local server from a remote browser', async () => {
    mocks.desktop.mockReturnValue(false);
    render(<Jarvis />);
    await screen.findByText('common.jarvis.desktopOnly');
    expect(mocks.open).not.toHaveBeenCalled();
    expect(document.querySelector('iframe')).toBeNull();
  });

  it('reloads the iframe through the existing service', async () => {
    mocks.open.mockResolvedValue({ url: 'http://127.0.0.1:12345/#session=test' });
    render(<Jarvis />);
    await screen.findByTitle('common.jarvis.title');
    fireEvent.click(screen.getByRole('button', { name: 'common.jarvis.reload' }));
    await waitFor(() => expect(mocks.open).toHaveBeenCalledTimes(2));
  });

  it('enters fullscreen and restores the window when Jarvis unmounts', async () => {
    mocks.open.mockResolvedValue({ url: 'http://127.0.0.1:12345/#session=test' });
    const view = render(<Jarvis />);
    await screen.findByTitle('common.jarvis.title');
    expect(mocks.fullscreen).toHaveBeenCalledWith(true);
    view.unmount();
    expect(mocks.fullscreen).toHaveBeenLastCalledWith(false);
  });

  it('exits back to the page used to open Jarvis, even when startup fails', async () => {
    mocks.open.mockRejectedValue(new Error('Failed'));
    render(<Jarvis />);
    await screen.findByRole('alert');
    fireEvent.click(screen.getByRole('button', { name: 'common.jarvis.exit' }));
    expect(mocks.navigate).toHaveBeenCalledWith('/assistants', { replace: true });
  });

  it('keeps a labeled, focusable entry when the sidebar collapses', () => {
    const onClick = vi.fn();
    render(<SiderJarvisEntry collapsed isActive onClick={onClick} siderTooltipProps={{ disabled: true }} />);
    const entry = screen.getByRole('button', { name: 'common.jarvis.title' });
    expect(entry.getAttribute('aria-current')).toBe('page');
    fireEvent.click(entry);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
