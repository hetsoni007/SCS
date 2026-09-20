/* =====================================================================
   MAIL RETRY — the send function is injected, so the backoff behaviour
   can be tested against a deliberately failing sender without AWS.
   ===================================================================== */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Retry with exponential backoff. Returns { ok, attempts, error }. */
export async function sendWithRetry(sendFn, args, attempts = 3, onLog = () => {}) {
  let lastErr;
  for (let i = 1; i <= attempts; i++) {
    try {
      await sendFn(args);
      return { ok: true, attempts: i };
    } catch (e) {
      lastErr = e;
      onLog(`send attempt ${i}/${attempts} failed: ` + String(e.name || e.message || e));
      if (i < attempts) await sleep(250 * 2 ** (i - 1));
    }
  }
  return { ok: false, attempts, error: String(lastErr && (lastErr.message || lastErr.name)) };
}
