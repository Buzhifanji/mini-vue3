import { isArray, isObject } from '@vue/shared';
import { createVNode, isVNode, VNode } from "./vnode";

/**
 * 对于开发者来说，通过 h 函数来创建 虚拟dom（vnode）
 * @param type 
 * @param propsOrChilren 
 * @param children 
 * @returns 
 */
export function h(type: any, propsOrChilren?: any, children?: any): VNode {
  const l = arguments.length

  // 两个参数
  if (l === 2) {
    if (isObject(propsOrChilren) && !isArray(propsOrChilren)) {
      // propsOrChilren 为 children, 并且是 vnode，没有 props
      if (isVNode(propsOrChilren)) {
        return createVNode(type, null, [propsOrChilren])
      }

      // propsOrChilren 为 props，没有children
      return createVNode(type, propsOrChilren)
    } else {

      // 仅有 props
      return createVNode(type, null, propsOrChilren)
    }
  } else {
    // 参数超过 3 个
    if (l > 3) {
      children = Array.prototype.slice.call(arguments, 2)
    } else if (l === 3 && isVNode(children)) {
      children = [children]
    }

    return createVNode(type, propsOrChilren, children)
  }
}