const DEFAULT_WARN_AFTER = 3000;
const DEFAULT_ABORT_AFTER = 15000;
const DEFAULT_MAX_RETRIES = 2;
const RETRY_DELAYS = [2000, 5000];

function isAbortError(err) {
  return err instanceof DOMException && err.name === 'AbortError';
}

export function fetchWithTimeout(url, options = {}, config = {}) {
  const {
    warnAfter = DEFAULT_WARN_AFTER,
    abortAfter = DEFAULT_ABORT_AFTER,
    maxRetries = DEFAULT_MAX_RETRIES,
    onWarn,
    onRetry,
  } = config;

  async function attempt(attemptNum) {
    const controller = new AbortController();
    let warnTimerId;
    let aborted = false;

    const abortTimerId = setTimeout(() => {
      aborted = true;
      controller.abort();
    }, abortAfter);

    if (warnAfter > 0 && onWarn) {
      warnTimerId = setTimeout(() => onWarn(), warnAfter);
    }

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } catch (err) {
      if ((aborted || isAbortError(err)) && attemptNum < maxRetries) {
        if (onRetry) onRetry(attemptNum + 1, maxRetries);
        await new Promise((r) => setTimeout(r, RETRY_DELAYS[attemptNum] || 5000));
        return attempt(attemptNum + 1);
      }
      throw err;
    } finally {
      clearTimeout(abortTimerId);
      if (warnTimerId) clearTimeout(warnTimerId);
    }
  }

  return attempt(0);
}