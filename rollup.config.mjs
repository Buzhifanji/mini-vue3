import commonJS from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import ts from 'rollup-plugin-typescript2'

/**
 * 默认导出一个数组，数组的每一个对象都是一个单独的导出文件配置
 * 详细文档：https://www.rollupjs.com/guide/big-list-of-option
 */
export default [{
  input: 'packages/vue/src/index.ts',
  output: [
    {
      sourcemap: true,
      file: './packages/vue/dist/vue.js', // 导出地址
      format: 'iife',
      name: 'vue'
    }
  ],
  plugins: [
    ts({
      sourcemap: true,
    }),
    resolve(), // 模块导入的路径补全
    commonJS(), // 转 commonjs 为 esm
  ]
}]