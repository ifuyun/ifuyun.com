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
  return str.replace(/\$(\d+)/ig, (matched, index) =>
    params[index] && params[index].toString() || matched
  );
}
