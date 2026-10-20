import { useCallback } from 'react';
import { useNotice } from './PurchaseNotice';

// Short message card at the bottom of the screen (same look as purchase notices).
// const [toast, showToast] = useToast(); ... {toast} ... showToast('Title · detail');
// "A · B" or "A: B" is split into a bold title and a softer subtitle.
export function useToast(duration = 2600) {
  const [el, notify] = useNotice(duration, 96);
  const show = useCallback((m, ms) => {
    let title = String(m), subtitle;
    const colon = title.indexOf(': ');
    const dot = title.indexOf(' · ');
    if (colon > 0) { subtitle = title.slice(colon + 2); title = title.slice(0, colon); }
    else if (dot > 0) { subtitle = title.slice(dot + 3); title = title.slice(0, dot); }
    if (subtitle) subtitle = subtitle[0].toUpperCase() + subtitle.slice(1) + (/[.!?]$/.test(subtitle) ? '' : '.');
    notify({ title, subtitle });
  }, [notify]);
  return [el, show];
}
