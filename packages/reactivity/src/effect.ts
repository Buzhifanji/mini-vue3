import { extend, isArray } from '@vue/shared'
import { ComputedRefImpl } from './computed'
import { createDep, Dep } from './dep'

// stores {target -> key -> Dep}
type KeyToDepMap = Map<any, Dep>
const targetMap = new WeakMap<any, KeyToDepMap>()

export type EffectScheduler = (...args: any[]) => any

export interface ReactiveEffectOptions {
  lazy?: boolean
  scheduler?: EffectScheduler
}

export function effect<T = any>(fn: () => T, options?: ReactiveEffectOptions) {
  const _effect = new ReactiveEffect(fn)

  // 主要是合并 调度器 scheduler 属性，从而 通过 scheduler 控制代码执行顺序
  // （lazy 属性 ReactiveEffect 并未定义）
  if (options) {
    extend(_effect, options)
  }

  // 懒执行
  if (!options || !options.lazy) {
    _effect.run()
  }
}

export let activeEffect: ReactiveEffect | undefined;

export class ReactiveEffect<T = any> {

  computed?: ComputedRefImpl<T>; // 计算属性 

  constructor(
    public fn: () => T,
    public scheduler: EffectScheduler | null = null, // 调度器
  ) { }

  run() {
    activeEffect = this;

    return this.fn();
  }

  stop() {
    // TODO
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

  /**
   * 
   * const computedObj = computed(() => {
      console.log("计算属性执行")
      return "姓名： " + obj.name
    })

    // effect 完成依赖收集
    effect(() => {
      document.querySelector("#app").innerText = computedObj.value
      document.querySelector("#app").innerText = computedObj.value
    })

    // 触发依赖
    setTimeout(() => {
      obj.name = "li mei"
    }, 1000)
   * 
   * 解决 computed 循环调用的问题：
   * 引发原因：如果先执行没有调度器的effect，会读取 computed 的value 属性，会触发依赖收集，
   * 由于computed 的_dirty为false，再次调用有调度器的 effect 时候，会更新依赖，如此循环反复。
   */
  for (const effect of effects) {
    if (effect.computed) {
      triggerEffect(effect)
    }
  }

  for (const effect of effects) {
    if (!effect.computed) {
      triggerEffect(effect)
    }
  }
}

/**
 * 触发指定 依赖执行
 * @param effect 
 */
export function triggerEffect(effect: ReactiveEffect) {
  if (effect.scheduler) {
    // 如果有调度器，执行调度器
    effect.scheduler()
  } else {
    effect.run()
  }
}
