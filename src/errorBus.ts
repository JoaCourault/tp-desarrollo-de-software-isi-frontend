export type ErrorPayload = {
  title?: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
};

const EVENT_NAME = 'app:error';

export function emitError(payload: ErrorPayload) {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: payload }));
  } catch (e) {
    // ignore
  }
}

// Alias/general helper for non-error messages (success/info). Reuses the same bus.
export function emitMessage(payload: ErrorPayload) {
  emitError(payload);
}

export function addErrorListener(handler: (payload: ErrorPayload) => void) {
  if (typeof window === 'undefined') return () => {};
  const listener = (e: Event) => {
    const ce = e as CustomEvent<ErrorPayload>;
    handler(ce.detail);
  };
  window.addEventListener(EVENT_NAME, listener as EventListener);
  return () => window.removeEventListener(EVENT_NAME, listener as EventListener);
}
