export const RAWBT_PACKAGE = 'ru.a402d.rawbtprinter';

export const RAWBT_PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${RAWBT_PACKAGE}`;

export function isAndroidDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /android/i.test(navigator.userAgent);
}

/** Encode ESC/POS bytes to base64 for RawBT intent payload. */
export function bytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }

  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const chunk = bytes.subarray(offset, offset + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

/** Android intent URL that opens RawBT with ESC/POS base64 payload. */
export function buildRawBtIntentUrl(base64Data: string): string {
  return `intent:rawbt:base64,${base64Data}#Intent;scheme=rawbt;package=${RAWBT_PACKAGE};end`;
}

/** Direct scheme fallback (some WebViews). */
export function buildRawBtSchemeUrl(base64Data: string): string {
  return `rawbt:base64,${base64Data}`;
}

export interface RawBtDispatchResult {
  readonly opened: boolean;
}

/**
 * Dispatch print payload to RawBT via Android intent.
 * Returns opened=true when the page loses focus (RawBT likely opened).
 */
export function dispatchRawBtPrint(base64Data: string, timeoutMs = 1500): Promise<RawBtDispatchResult> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.resolve({ opened: false });
  }

  const url = buildRawBtIntentUrl(base64Data);

  return new Promise((resolve) => {
    let settled = false;

    const finish = (opened: boolean) => {
      if (settled) return;
      settled = true;
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisibility);
      iframe.remove();
      resolve({ opened });
    };

    const onBlur = () => finish(true);
    const onVisibility = () => {
      if (document.hidden) finish(true);
    };

    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibility);

    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'display:none;width:0;height:0;border:0';
    iframe.src = url;
    document.body.appendChild(iframe);

    window.setTimeout(() => {
      try {
        window.location.href = buildRawBtSchemeUrl(base64Data);
      } catch {
        // ignore navigation errors in restricted contexts
      }
      window.setTimeout(() => finish(false), 400);
    }, timeoutMs);
  });
}

/**
 * Probe whether RawBT is installed by attempting a lightweight intent.
 * opened=true implies RawBT responded (page blurred / hidden).
 */
export function probeRawBtInstalled(timeoutMs = 1200): Promise<boolean> {
  if (!isAndroidDevice() || typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.resolve(false);
  }

  return new Promise((resolve) => {
    let settled = false;

    const finish = (installed: boolean) => {
      if (settled) return;
      settled = true;
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisibility);
      iframe.remove();
      resolve(installed);
    };

    const onBlur = () => finish(true);
    const onVisibility = () => {
      if (document.hidden) finish(true);
    };

    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibility);

    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'display:none;width:0;height:0;border:0';
    iframe.src = `intent://check/#Intent;scheme=rawbt;package=${RAWBT_PACKAGE};end`;
    document.body.appendChild(iframe);

    window.setTimeout(() => finish(false), timeoutMs);
  });
}
