import { isReactive } from '@vue/reactivity';
import { EMPTY_OBJ, hasChanged, isObject } from '@vue/shared';
import { ReactiveEffect } from 'packages/reactivity/src/effect';
import { queueJob } from './scheduler';

export interface WatchOptions<immediate = boolean> {
  immediate?: immediate;
  deep?: boolean
}

/**
 * 简化版 watch，只监听 reactive 
 * 对于监听 ref，数组，function暂未实现 
 * @param source 
 * @param cb 
 * @param options 
 * @returns 
 */
export function watch(source: any, cb: Function, options?: WatchOptions) {
  return doWatch(source, cb, options)
}

function doWatch(source: any, cb: Function, { immediate, deep }: WatchOptions = EMPTY_OBJ) {

  // 处理 getter 函数
  let getter: () => any

  if (isReactive(source)) {
    getter = () => source
    deep = true
  } else {
    getter = () => { }
  }

  if (cb && deep) {
    // 浅拷贝
    const baseGetter = getter
    // traverse 遍历对象，触发依赖收集
    getter = () => traverse(baseGetter())
  }

  let oldValue = {}

  const job = () => {
    if (cb) {
      // 执行 副作用fn函数，也就是 上面定义的getter函数，这样就会触发依赖收集
      const newValue = effect.run()
      if (deep || hasChanged(newValue, oldValue)) {
        // 如果值发生了改变，或者是 deep，就调用 watch 包裹的第二个回调函数 
        cb(newValue, oldValue)
        oldValue = newValue
      }
    }
  }

  // 调度器
  // 将 job 加入任务队列，添加完之后，通过 promise 来 执行job。由于 promise 是微任务，同步代码执行完之后，才会执行。
  // 所以 这个调度器改变了代码执行的顺序。同时执行 job 之前，会删除重复的 job，所以也改变了代码的执行规则。
  const scheduler = () => queueJob(job)

  const effect = new ReactiveEffect(getter, scheduler)

  if (cb) {
    if (immediate) {
      job()
    } else {
      // 执行 副作用fn函数，也就是 上面定义的getter函数，这样就会触发依赖收集
      oldValue = effect.run()
    }
  } else {
    // 执行 副作用fn函数，也就是 上面定义的getter函数，这样就会触发依赖收集
    effect.run()
  }

  return () => {
    effect.stop()
  }
}

export function traverse(value: unknown) {
  if (!isObject(value)) {
    return value
  }

  for (const key in value as object) {
    traverse((value as any)[key])
  }

  return value
}