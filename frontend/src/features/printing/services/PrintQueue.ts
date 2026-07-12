import type { PrintJob, PrintJobStatus } from '../types/printer';
import type { Receipt } from '../types/receipt';

const STORAGE_KEY = 'wn_print_queue';

/** In-memory + localStorage print queue structure (no worker). */
export class PrintQueue {
  private jobs: PrintJob[] = [];

  constructor() {
    this.jobs = this.load();
  }

  enqueue(receipt: Receipt): PrintJob {
    const job: PrintJob = {
      id: crypto.randomUUID(),
      orderNumber: receipt.orderNumber,
      receipt,
      status: 'pending',
      createdAt: new Date().toISOString(),
      attempts: 0,
    };
    this.jobs.unshift(job);
    this.persist();
    return job;
  }

  markStatus(id: string, status: PrintJobStatus, lastError?: string): void {
    this.jobs = this.jobs.map((job) =>
      job.id === id
        ? {
            ...job,
            status,
            attempts: status === 'failed' ? job.attempts + 1 : job.attempts,
            lastError,
          }
        : job,
    );
    this.persist();
  }

  list(): readonly PrintJob[] {
    return this.jobs;
  }

  private load(): PrintJob[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as PrintJob[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private persist(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.jobs.slice(0, 50)));
  }
}
