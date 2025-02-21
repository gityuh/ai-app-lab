/**
 * 模拟sleep函数 单位毫秒
 * @param ms 毫秒
 * @returns Promise
 */
export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
