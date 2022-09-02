/**
 * 生成随机ID字符串：10/11位十六进制时间戳+6/5位十六进制随机数
 * @return {string} ID
 * @version 1.0.0
 * @since 1.0.0
 */
export function generateId() {
  // 1e12 + 0x4ba0000000
  const idLen = 16;
  const hex = 16;
  const timeBased = 1324806901760; // 2011-12-25 17:55:01
  const timeStamp = Date.now() - timeBased;
  const id = timeStamp.toString(hex);
  let randomStr = '';

  for (let idx = 0; idx < idLen - id.length; idx += 1) {
    randomStr += Math.floor(Math.random() * hex).toString(hex);
  }

  return id + randomStr;
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
  return str.replace(/\$(\d+)/gi, (matched, index) => (params[index] && params[index].toString()) || matched);
}
