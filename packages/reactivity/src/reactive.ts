import { isObject } from '@vue/shared';
import { mutableHandlers } from "./baseHandlers";

export const reactiveMap = new WeakMap<object, any>();

export const enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive'
}

export interface Target {
  [ReactiveFlags.IS_REACTIVE]?: boolean
}

export function reactive(target: object) {
  return createReactiveObject(target, mutableHandlers, reactiveMap)
}

/**
 * 只关注 主支线
 * 省略 mutableCollectionHandlers
 * 省略 shallow、readonly
 * @param target 对象
 * @param baseHandlers 处理 getter/setter 
 * @param proxyMap 存储数据中心
 */
function createReactiveObject(target: object, baseHandlers: ProxyHandler<any>, proxyMap: WeakMap<object, any>) {
  // 尝试获取缓存数据
  const existingProxy = proxyMap.get(target)
  if (existingProxy) {
    return existingProxy
  }

  // 没有缓存数据，则创建一个新的
  const proxy = new Proxy(target, baseHandlers)

  // 定义类型，这里和源码里不一样，源码里判断是否为 reactive 是在 createGetter 里 利用闭包 进行数据判断，而这里是直接显性 类型赋值
  proxy[ReactiveFlags.IS_REACTIVE] = true

  return proxy
}

export const toReactive = <T extends unknown>(value: T): T => isObject(value) ? reactive(value as object) : value

export const isReactive = (value: unknown): boolean => !!(value && (value as Target)[ReactiveFlags.IS_REACTIVE])