// The desktop host passes a per-launch capability in the URL fragment. It is
// never sent as a referrer and is held only for the lifetime of this tab.
function sessionToken(): string {
  if (typeof window === 'undefined') return '';
  return new URLSearchParams(window.location.hash.slice(1)).get('session') || '';
}

export function jarvisFetch(input: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  const token = sessionToken();
  if (token) headers.set('x-jarvis-token', token);
  return fetch(input, { ...init, headers });
}

// Audio elements cannot set headers. This URL stays on the loopback server.
export function jarvisApiUrl(input: string): string {
  const url = new URL(input, window.location.origin);
  const token = sessionToken();
  if (token) url.searchParams.set('session', token);
  return url.toString();
}
