export const TOOL_URL_ENTRY = '/tool';
export const TOOL_LINKS = Object.freeze([
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
    label: 'IP 地址查询',
    url: TOOL_URL_ENTRY + '/ip',
    title: 'IP 地址查询',
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

export const REGEXP_JD_PRODUCT_DETAIL_URL = /^https?:\/\/([a-zA-Z0-9\-_]+\.)*jd\.com\/(product\/)?\d+\.html$/i;

export const MD5_PAGE_DESCRIPTION = 'MD5 在线加密工具，在线实现 MD5 加密算法，轻松校验、复制 MD5 加密结果。';
export const MD5_PAGE_KEYWORDS = Object.freeze([
  'MD5',
  'MD5加密',
  'MD5加密算法',
  'MD5加密工具',
  'MD5在线加密',
  'MD5校验',
  'MD5校验工具'
]);

export const MURMURHASH_PAGE_DESCRIPTION =
  'MurmurHash 在线哈希工具，在线实现 MurmurHash 一致性哈希算法，轻松计算、复制 MurmurHash 结果。';
export const MURMURHASH_PAGE_KEYWORDS = Object.freeze([
  'MurmurHash',
  'Murmur哈希',
  '一致性哈希',
  'MurmurHash工具',
  'Murmur哈希工具',
  'MurmurHash在线哈希工具',
  'MurmurHash算法'
]);

export const BASE64_PAGE_DESCRIPTION =
  'Base64 在线编解码工具，在线实现 Base64 编解码算法，轻松校验、复制 Base64 编解码结果。';
export const BASE64_PAGE_KEYWORDS = Object.freeze([
  'Base64',
  'Base64编码',
  'Base64解码',
  'Base64加密',
  'Base64解密',
  'Base64编码算法',
  'Base64解码算法',
  'Base64加密算法',
  'Base64解密算法',
  'Base64加密工具',
  'Base64解密工具',
  'Base64在线加密',
  'Base64在线解密'
]);

export const IP_PAGE_DESCRIPTION = 'IP 地址查询工具，在线查询 IP 地址、IP 归属地、IP 运营商、CDN 等。';
export const IP_PAGE_KEYWORDS = Object.freeze([
  'IP查询',
  'IP地址查询',
  'IP归属地查询',
  'IP运营商查询',
  'CDN查询',
  'IP在线查询',
  'IP数据库'
]);
