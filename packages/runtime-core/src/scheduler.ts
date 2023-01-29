let isFlushPending = false

const resolvedPromise = Promise.resolve() as Promise<any>

// let currentFlushPromise: Promise<void> | null = null; // 当前执行的微任务

const queue: Function[] = [] // 任务队列

export function queueJob(job: Function) {
  // 加入任务队列
  queue.push(job)
  queueFlush()
}

function queueFlush() {
  if (!isFlushPending) {
    isFlushPending = true
    // 加入 微任务，从而影响代码的执行顺序
    // currentFlushPromise = resolvedPromise.then(flushJobs)
    resolvedPromise.then(flushJobs)
  }
}

function flushJobs() {
  isFlushPending = false
  flushPreFlushCbs()
}

export function flushPreFlushCbs() {
  const n = queue.length;
  if (n) {
    // 去重
    const activePreFlushCbs = [...new Set(queue)]
    queue.length = 0;

    for (let i = 0; i < n; i++) {
      activePreFlushCbs[i]()
    }
  }
}