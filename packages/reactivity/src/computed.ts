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

  // set value(newValue: T) {
  //   this.
  // }
}