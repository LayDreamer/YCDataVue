/**
 * 文本截断工具：超过指定长度时显示省略号，并保留完整内容用于 tooltip 展示
 * @param text 原始文本
 * @param maxLen 最大显示字数
 * @param emptyText 文本为空时显示的内容，默认空字符串
 */
export function truncateText(
  text: string | undefined | null,
  maxLen: number,
  emptyText = ''
): string {
  if (!text) return emptyText;
  return text.length > maxLen ? text.slice(0, maxLen) + '...' : text;
}
