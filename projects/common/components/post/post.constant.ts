export const POST_LICENSE = new Map<number, { label: string; title: string }>([
  [1, { label: '禁止转载', title: '禁止转载' }],
  [2, { label: '转载需授权', title: '转载需授权' }],
  [3, { label: 'CC: BY-NC-ND 4.0', title: '自由转载 - 署名 - 非商业性使用 - 禁止演绎' }],
  [4, { label: 'CC: BY-NC-SA 4.0', title: '自由转载 - 署名 - 非商业性使用 - 相同方式共享' }],
  [5, { label: 'CC: BY-NC 4.0', title: '自由转载 - 署名 - 非商业性使用' }],
  [6, { label: 'CC: BY-ND 4.0', title: '自由转载 - 署名 - 禁止演绎' }],
  [7, { label: 'CC: BY-SA 4.0', title: '自由转载 - 署名 - 相同方式共享' }],
  [8, { label: 'CC: BY 4.0', title: '自由转载 - 署名' }]
]);
export const POST_LICENSE_LINK = new Map<number, string>([
  [3, 'https://creativecommons.org/licenses/by-nc-nd/4.0/deed.zh'],
  [4, 'https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh'],
  [5, 'https://creativecommons.org/licenses/by-nc/4.0/deed.zh'],
  [6, 'https://creativecommons.org/licenses/by-nd/4.0/deed.zh'],
  [7, 'https://creativecommons.org/licenses/by-sa/4.0/deed.zh'],
  [8, 'https://creativecommons.org/licenses/by/4.0/deed.zh']
]);
