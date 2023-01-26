export const TOOL_URL_PREFIX = '/tool';
export const TOOL_LINKS = Object.freeze([
  {
    label: '电商工具',
    url: TOOL_URL_PREFIX + '/shopping',
    title: '电商工具',
    changefreq: 'weekly',
    priority: 0.7
  },
  {
    label: 'MD5 加密',
    url: TOOL_URL_PREFIX + '/md5',
    title: 'MD5 加密',
    changefreq: 'monthly',
    priority: 0.7
  },
  {
    label: 'MurmurHash',
    url: TOOL_URL_PREFIX + '/murmurhash',
    title: 'MurmurHash',
    changefreq: 'monthly',
    priority: 0.7
  }
]);
export const REGEXP_JD_PRODUCT_DETAIL_URL = /^https?:\/\/([a-zA-Z0-9\-_]+\.)*jd\.com\/(product\/)?\d+\.html$/i;

export const SHOPPING_PAGE_DESCRIPTION =
  '电商工具提供京东、淘宝、天猫、拼多多等电商平台的转链等功能，助力实现超级网购省钱计划。';
export const SHOPPING_PAGE_KEYWORDS = Object.freeze([
  '京东转链',
  '淘宝转链',
  '转链工具',
  '电商转链',
  '省钱工具',
  '网购省钱计划',
  '京东省钱计划',
  '京东联盟',
  '京东推客',
  '淘宝客',
  '淘宝联盟'
]);

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
