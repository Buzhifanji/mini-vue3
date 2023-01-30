import { isReactive } from '@vue/reactivity';
import { EMPTY_OBJ, hasChanged } from '@vue/shared';
import { ReactiveEffect } from 'packages/reactivity/src/effect';
import { queueJob } from './scheduler';

export interface WatchOptions<immediate = boolean> {
  immediate?: immediate;
  deep?: boolean
}


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

  // 触发 依赖收集逻辑
  if (cb && deep) {
    // 浅拷贝
    const baseGetter = getter
    getter = () => baseGetter()
  }

  let oldValue = {}

  const job = () => {
    if (cb) {
      const newValue = effect.run()
      if (deep || hasChanged(newValue, oldValue)) {
        cb(newValue, oldValue)
        oldValue = newValue
      }
    }
  }

  // 调度器
  const scheduler = () => queueJob(job)

  const effect = new ReactiveEffect(getter, scheduler)

  if (cb) {
    if (immediate) {
      job()
    } else {
      oldValue = effect.run()
    }
  } else {
    effect.run()
  }

  return () => {
    effect.stop()
  }
}