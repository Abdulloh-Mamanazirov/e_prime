/**
 * Server-side request queue with rate limiting.
 *
 * Ensures only ONE translation request hits the Gemini API at a time,
 * with a configurable minimum gap between calls. Pending requests
 * wait in line instead of hammering the API in parallel.
 *
 * This is a module-level singleton — the same queue instance persists
 * across API route invocations within the same Node.js process.
 */

interface QueueItem<T> {
  execute: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
}

class RequestQueue {
  private queue: QueueItem<unknown>[] = [];
  private processing = false;
  private lastRequestTime = 0;
  private minGapMs: number;

  constructor(minGapMs = 1500) {
    this.minGapMs = minGapMs;
  }

  /**
   * Enqueue a function that returns a promise.
   * The function won't execute until all prior queued items finish
   * and the minimum gap since the last API call has elapsed.
   */
  enqueue<T>(execute: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        execute: execute as () => Promise<unknown>,
        resolve: resolve as (value: unknown) => void,
        reject,
      });
      this.processNext();
    });
  }

  private async processNext(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;
    const item = this.queue.shift()!;

    // Enforce minimum gap between API calls
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.minGapMs) {
      await new Promise((r) => setTimeout(r, this.minGapMs - elapsed));
    }

    try {
      this.lastRequestTime = Date.now();
      const result = await item.execute();
      item.resolve(result);
    } catch (error) {
      item.reject(error);
    } finally {
      this.processing = false;
      this.processNext();
    }
  }

  /** Number of items waiting in the queue (not including the active one). */
  get pending(): number {
    return this.queue.length;
  }
}

// Singleton: 1.5 second minimum gap between Gemini API calls
export const translationQueue = new RequestQueue(1500);
