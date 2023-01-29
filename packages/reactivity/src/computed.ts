import { isFunction } from '@vue/shared';
import { Dep } from './dep';
import { ReactiveEffect } from './effect';
import { trackRefValue, triggerRefValue } from './ref';

export type ComputedGetter<T> = (...args: any[]) => T;

/**
 * 忽略 自定义的 gettet/setter， 只实现一个 getter
 * @param getterOrOptions 
 * @returns 
 */
export function computed<T>(getterOrOptions: ComputedGetter<T>) {
  let getter: ComputedGetter<T>

  const onlyGetter = isFunction(getterOrOptions)

  if (onlyGetter) {
    getter = getterOrOptions
  } else {
    // 忽略 自定义的 gettet/setter
  }

  const cRef = new ComputedRefImpl<T>(getter!)

  return cRef
}

/**
 * 读取计算属性，与 RefImpl模板结构类似，定义 value 的 getter/setter 
 */
export class ComputedRefImpl<T> {
  public dep?: Dep = undefined; // 存储依赖数据

  private _value!: T;

  public readonly effect: ReactiveEffect<T> // 副作用函数

  public readonly __v__isRef = true; // 类型标记

  public _dirty: boolean = true; // 脏变量

  constructor(getter: ComputedGetter<T>) {
    // 调度器
    const scheduler = () => {
      // get value d
      if (!this._dirty) {
        this._dirty = true;
        // 更新依赖
        triggerRefValue(this)
      }
    }
    this.effect = new ReactiveEffect(getter, scheduler)
    this.effect.computed = this
  }

  /**
   * 这里一共会触发两次依赖收集：
   * 第一次是：当读取 value 时，会执行 trackRefValue，此时 activeEffect 为 effect 包裹的副作用函数，与 reactive 逻辑一样，
   * 这个收集依赖是没有调度器的
   * 
   * 第二次是：effect.run 函数执行的时候，。此时执行的是 computed 包裹的副作用函数 fn，fn函数里如果有响应式对象数据，执行的时候，会触发依赖收集，
   * 而 activeEffect 正好为 computed，这样 computed 与响应式包裹的响应式对象数据建立了依赖关系。
   * computed实例化的时候，会定义一个 scheduler 调度器，所以此时 收集的依赖是有调度器的。
   * 
   * 当响应式对象数据发生变化时，会触发effect依赖，由于 computed 定义 scheduler，所以会执行 scheduler，而不是 computed 包裹的fn函数
   * 此时如果 _dirty 为false，会更新依赖，这个依赖正是第一次收集好的依赖，也就会执行  effect 包裹的副作用函
   * 
   */
  get value() {
    // 收集依赖
    trackRefValue(this)

    // 只有数据脏了，才会执行fn函数（数据脏了，指的是依赖数据发生变化）
    if (this._dirty) {
      this._dirty = false
      // 执行 fn 函数
      this._value = this.effect.run();
    }

    return this._value
  }

  // 省略 set value
}