import { hasChanged } from '@vue/shared';
import { createDep, Dep } from './dep';
import { activeEffect, trackEffects, triggerEffects } from './effect';
import { toReactive } from './reactive';

export interface Ref<T = any> {
  value: T
}

export function ref(value?: unknown) {
  return createRef(value, false);
}

function createRef(rawValue: unknown, shallow: boolean) {
  if (isRef(rawValue)) {
    return rawValue
  }

  return new RefImpl(rawValue, shallow)
}

// is 类型 之前没有使用，需要案例去理解
// 判断是否为 ref
export function isRef(r: any): r is Ref {
  return !!(r && r.__v__isRef === true)
}

// 对于基本数据类型 是通过 value 的getter/setter 来侦测数据变更的，因为基本数据类型不能通过 proxy 进行代理。
// 对于引用数据类型，会调用 reactive，进行对象代理
class RefImpl<T>  {
  private _value: T;
  private _rawValue: T; // 缓存变更之前的 value

  public dep?: Dep = undefined; // 存储依赖数据

  public readonly __v__isRef = true; // 用于判断 是否为 ref 类型

  // __v__isShallow 是否为浅代理
  constructor(value: T, public readonly __v__isShallow: boolean) {
    this._rawValue = value;
    this._value = __v__isShallow ? value : toReactive(value);
  }

  get value() {
    // 收集依赖
    trackRefValue(this)
    return this._value
  }

  set value(newVal) {
    if (hasChanged(newVal, this._rawValue)) {
      this._rawValue = newVal;
      // 如果是基本数据类型，toReactive 会直接返回 newVal；反之就会调用reactive，进行对象代理
      this._value = toReactive(newVal);

      // 触发依赖
      triggerRefValue(this)
    }
  }
}

/**
 * 收集依赖
 */
function trackRefValue(ref: RefImpl<any>) {
  if (activeEffect) {
    // 执行依赖收集的逻辑
    trackEffects(ref.dep || (ref.dep = createDep()))
  }
}

function triggerRefValue(ref: RefImpl<any>) {
  if (ref.dep) {
    triggerEffects(ref.dep)
  }
}