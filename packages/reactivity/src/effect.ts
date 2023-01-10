import { isArray } from '@vue/shared'
import { createDep, Dep } from './dep'

// stores {target -> key -> Dep}
type KeyToDepMap = Map<any, Dep>
const targetMap = new WeakMap<any, KeyToDepMap>()

export function effect<T = any>(fn: () => T) {
  const _effect = new ReactiveEffect(fn)

  _effect.run()
}

export let activeEffect: ReactiveEffect | undefined;

export class ReactiveEffect<T = any> {
  constructor(public fn: () => T) { }

  run() {
    activeEffect = this;

    return this.fn();
  }
}

/**
 * 收集依赖
 * @param target 
 * @param key 
 */
export function track(target: object, key: unknown) {
  if (!activeEffect) return

  // 把 activeEffect 存储到 定义好的数据结构（{target -> key -> dep}）中
  let depMap = targetMap.get(target)
  if (!depMap) {
    targetMap.set(target, (depMap = new Map()))
  }

  let dep = depMap.get(key)
  if (!dep) {
    depMap.set(key, (dep = createDep()))
  }

  trackEffects(dep)
}

/**
 * 触发依赖
 */
export function trigger(target: object, key: unknown, newValue: unknown) {
  // 从 targetMap 里取出依赖
  const depsMap = targetMap.get(target)
  if (!depsMap) return

  const dep = depsMap.get(key)
  if (!dep) return

  triggerEffects(dep)
}

/**
 * 利用 dep 依次跟踪指定 key 的 所有 effect
 * @param dep 
 */
export function trackEffects(dep: Dep) {
  // 存储依赖
  dep.add(activeEffect!)
}

/**
 * 依次触发 dep 中保存的依赖
 * @param dep 
 */
export function triggerEffects(dep: Dep) {
  const effects = isArray(dep) ? dep : [...dep]

  // 依次触发依赖
  for (const effect of effects) {
    triggerEffect(effect)
  }
}

/**
 * 触发指定 依赖执行
 * @param effect 
 */
export function triggerEffect(effect: ReactiveEffect) {
  effect.run()
}