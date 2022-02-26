/**
 * 截取字符串为指定长度，超过长度加'...'
 * @param {string} srcStr 源字符串
 * @param {number} cutLength 指定长度
 * @return {string} 截取结果字符串
 * @version 1.0.0
 * @since 1.0.0
 */
export function cutStr(srcStr: string, cutLength: number) {
  let resultStr;
  let i = 0;
  let n = 0;
  let curChar;
  const half = 0.5;

  while (n < cutLength && i < srcStr.length) {
    curChar = srcStr.charCodeAt(i);
    if (curChar >= 192 || (curChar >= 65 && curChar <= 90)) {// 中文和大写字母计为1个
      n += 1;
      if (n <= cutLength) {
        i += 1;
      }
    } else {// 其余字符计为半个
      n += half;
      i += 1;
    }
  }
  resultStr = srcStr.substring(0, i);
  if (srcStr.length > i) {
    resultStr += '...';
  }
  return resultStr;
}

/**
 * 过滤HTML标签
 * @param {string} srcStr 源字符串
 * @return {string} 过滤结果字符串
 * @version 1.0.0
 * @since 1.0.0
 */
export function filterHtmlTag(srcStr: string) {
  return srcStr.replace(/<\/?[^>]*>/ig, '');
}
