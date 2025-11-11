'use client';

import { useEffect } from 'react';

export type ModalPayload = {
  title?: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
};

const EVENT_NAME = 'app:modal';

/**
 * Imperative function to show a modal globally. Can be called from non-React modules
 * (for example services) and will dispatch an event that a host component can listen to.
 */
export function showModal(payload: ModalPayload) {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: payload }));
  } catch (e) {
    // ignore
  }
}

/**
 * Register an event listener (imperative) and return an unsubscribe function.
 * Useful for non-React modules or for testing.
 */
export function addModalListener(handler: (payload: ModalPayload) => void) {
  if (typeof window === 'undefined') return () => {};
  const listener = (e: Event) => {
    const ce = e as CustomEvent<ModalPayload>;
    handler(ce.detail);
  };
  window.addEventListener(EVENT_NAME, listener as EventListener);
  return () => window.removeEventListener(EVENT_NAME, listener as EventListener);
}

/**
 * React hook that registers a modal listener while the component is mounted.
 * Usage: useModalAlert((payload) => { ...show modal... })
 */
export function useModalAlert(handler: (payload: ModalPayload) => void) {
  useEffect(() => {
    const unsubscribe = addModalListener(handler);
    return () => unsubscribe();
  }, [handler]);
}
