import { ScheduledTask } from '@/types/indexPilot';

/**
 * Scheduler
 * Executes tasks at regular intervals using cron expressions or setTimeout
 */
export class Scheduler {
  private tasks: Map<string, ScheduledTask> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Register a scheduled task
   */
  registerTask(task: Omit<ScheduledTask, 'id'>): void {
    const id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullTask: ScheduledTask = {
      ...task,
      id,
    };

    this.tasks.set(id, fullTask);

    if (task.enabled) {
      this.startTask(id);
    }
  }

  /**
   * Start a task
   */
  private startTask(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (!task) return;

    // Calculate next run time and set timeout
    const nextRun = this.calculateNextRun(task.cronExpression);
    const delay = nextRun.getTime() - Date.now();

    task.nextRun = nextRun;

    const timer = setTimeout(async () => {
      try {
        task.lastRun = new Date();
        await task.handler();
      } catch (err) {
        console.error(`Task ${task.name} failed:`, err);
      }

      // Reschedule the task
      if (task.enabled) {
        this.startTask(taskId);
      }
    }, Math.max(0, delay));

    this.timers.set(taskId, timer);
  }

  /**
   * Stop a task
   */
  stopTask(taskId: string): void {
    const timer = this.timers.get(taskId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(taskId);
    }

    const task = this.tasks.get(taskId);
    if (task) {
      task.enabled = false;
    }
  }

  /**
   * Enable a task
   */
  enableTask(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (task && !task.enabled) {
      task.enabled = true;
      this.startTask(taskId);
    }
  }

  /**
   * Disable a task
   */
  disableTask(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.enabled = false;
      this.stopTask(taskId);
    }
  }

  /**
   * Calculate next run time based on cron expression
   * Simple implementation - handles common patterns
   */
  private calculateNextRun(cronExpression: string): Date {
    const now = new Date();

    // Simple cron patterns
    if (cronExpression === 'every_minute') {
      return new Date(now.getTime() + 60 * 1000);
    }

    if (cronExpression === 'every_hour') {
      return new Date(now.getTime() + 60 * 60 * 1000);
    }

    if (cronExpression === 'every_day') {
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }

    if (cronExpression === 'every_6_hours') {
      return new Date(now.getTime() + 6 * 60 * 60 * 1000);
    }

    // Default: every hour
    return new Date(now.getTime() + 60 * 60 * 1000);
  }

  /**
   * Initialize default IndexPilot tasks
   */
  initializeDefaultTasks(): void {
    // Process queue every minute
    this.registerTask({
      name: 'Process Queue',
      cronExpression: 'every_minute',
      enabled: true,
      handler: async () => {
        console.log('📋 Processing queue...');
        // Implementation: get next jobs and process them
      },
    });

    // Retry failed jobs every hour
    this.registerTask({
      name: 'Retry Failed Jobs',
      cronExpression: 'every_hour',
      enabled: true,
      handler: async () => {
        console.log('🔄 Retrying failed jobs...');
        // Implementation: reprocess jobs scheduled for retry
      },
    });

    // Sync provider properties every 6 hours
    this.registerTask({
      name: 'Sync Provider Properties',
      cronExpression: 'every_6_hours',
      enabled: true,
      handler: async () => {
        console.log('🔗 Syncing provider properties...');
        // Implementation: sync GSC properties, IndexNow status, etc
      },
    });

    // Cleanup old logs and failed jobs daily
    this.registerTask({
      name: 'Cleanup',
      cronExpression: 'every_day',
      enabled: true,
      handler: async () => {
        console.log('🧹 Cleaning up old data...');
        // Implementation: delete old logs, cleanup failed jobs
      },
    });

    // Refresh authentication tokens
    this.registerTask({
      name: 'Refresh Tokens',
      cronExpression: 'every_6_hours',
      enabled: true,
      handler: async () => {
        console.log('🔐 Refreshing auth tokens...');
        // Implementation: refresh Google OAuth tokens, IndexNow keys, etc
      },
    });
  }

  /**
   * Get all tasks
   */
  getAllTasks(): ScheduledTask[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Get task by ID
   */
  getTask(taskId: string): ScheduledTask | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Shutdown scheduler
   */
  shutdown(): void {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();
  }
}

export const scheduler = new Scheduler();
