export type RetryOptions = {
  retries?: number
  backoffMs?: number
  timeoutMs?: number
}

export async function fetchWithRetry(
  input: string,
  init: RequestInit = {},
  opts: RetryOptions = {},
): Promise<Response> {
  const retries = opts.retries ?? 3
  const backoffMs = opts.backoffMs ?? 250
  const timeoutMs = opts.timeoutMs ?? 8000

  let lastErr: unknown
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const res = await fetch(input, {
        ...init,
        cache: "no-store",
        signal: controller.signal,
      })
      clearTimeout(id)
      if (res.ok) return res
      // Retry on transient statuses
      if ([429, 500, 502, 503, 504].includes(res.status) && attempt < retries) {
        await new Promise((r) => setTimeout(r, backoffMs * Math.pow(2, attempt)))
        continue
      }
      return res
    } catch (err) {
      clearTimeout(id)
      lastErr = err
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, backoffMs * Math.pow(2, attempt)))
        continue
      }
      throw err
    }
  }
  // Should not reach here; throw last error
  throw lastErr ?? new Error("fetchWithRetry failed without error")
}


