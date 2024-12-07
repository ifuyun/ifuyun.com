export const TOOL_URL_ENTRY = '/tool';
export const TOOL_LINKS = Object.freeze([
  {
    label: 'IP 地址查询',
    url: TOOL_URL_ENTRY + '/ip',
    title: 'IP 地址查询',
    changefreq: 'monthly',
    priority: 0.8
  },
  {
    label: 'MD5 加密',
    url: TOOL_URL_ENTRY + '/md5',
    title: 'MD5 加密',
    changefreq: 'monthly',
    priority: 0.8
  },
  {
    label: 'Base64 编解码',
    url: TOOL_URL_ENTRY + '/base64',
    title: 'Base64 编解码',
    changefreq: 'monthly',
    priority: 0.8
  },
  {
    label: 'MurmurHash',
    url: TOOL_URL_ENTRY + '/murmurhash',
    title: 'MurmurHash',
    changefreq: 'monthly',
    priority: 0.8
  },
  {
    label: '电商工具',
    url: TOOL_URL_ENTRY + '/shopping',
    title: '电商工具',
    changefreq: 'weekly',
    priority: 0.8
  }
]);
