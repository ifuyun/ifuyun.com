import murmurhash from 'murmurhash';

/**
 * 生成随机ID字符串：10位36进制时间戳+6位36进制随机数
 * @return {string} ID
 * @version 1.1.0
 * @since 1.0.0
 */
export function generateId() {
  const idLen = 16;
  const randomLen = 6;
  const radix = 36;
  const id = Date.now().toString(radix);
  let randomStr = '';

  for (let idx = 0; idx < randomLen; idx += 1) {
    randomStr += Math.floor(Math.random() * radix).toString(radix);
  }
  let prefix = '';
  for (let idx = 0; idx < idLen - randomLen - id.length; idx += 1) {
    prefix += '0';
  }

  return prefix + id + randomStr;
}

export function generateUid(ua: string) {
  let randomStr = '';
  for (let i = 0; i < 3; i += 1) {
    randomStr += ((Math.random() * 36) | 0).toString(36);
  }

  return `WA1.${murmurhash(ua, 20160124)}.${(Date.now() / 1000) | 0}.${randomStr}`;
}

/**
 * 格式化字符串
 * e.g. input: format('Hello $0, $1.', 'World', 'Fuyun')
 *      output: Hello World, Fuyun.
 *   or input: format('Hello $0, $1.', ['World', 'Fuyun'])
 *      output the same: Hello World, Fuyun.
 * Notice:
 *     When replacement is not supplied or is undefined,
 *     it will be replaced with empty string('')
 * @param {string} str source string
 * @param {(string | number)[]} params replacements
 * @return {string} output string
 */
export function format(str: string, ...params: (string | number)[]): string {
  if (Array.isArray(params[0])) {
    params = params[0];
  }
  return str.replace(/\$(\d+)/gi, (matched, index) => (params[index] && params[index].toString()) || '');
}

/**
 * 截取字符串为指定长度，超过长度加'...'
 * @param {string} str 源字符串
 * @param {number} length 指定长度
 * @return {string} 截取结果字符串
 * @version 1.0.0
 * @since 1.0.0
 */
export function truncateString(str: string, length: number) {
  let resultStr;
  let i = 0;
  let n = 0;
  let curChar;
  const half = 0.5;

  while (n < length && i < str.length) {
    curChar = str.charCodeAt(i);
    if (curChar >= 192 || (curChar >= 65 && curChar <= 90)) {
      // 中文和大写字母计为1个
      n += 1;
      if (n <= length) {
        i += 1;
      }
    } else {
      // 其余字符计为半个
      n += half;
      i += 1;
    }
  }
  resultStr = str.substring(0, i);
  if (str.length > i) {
    resultStr += '...';
  }
  return resultStr;
}

/**
 * 过滤HTML标签
 * @param {string} str 源字符串
 * @param {boolean} replaceLineBreak 是否过滤换行符，默认开启
 * @return {string} 过滤结果字符串
 * @version 1.1.0
 * @since 1.0.0
 */
export function filterHtmlTag(str: string, replaceLineBreak = true): string {
  const result = str.replace(/<\/?[^>]*>/gi, '');
  if (!replaceLineBreak) {
    return result;
  }
  return result.replace(/\n/gi, '');
}
