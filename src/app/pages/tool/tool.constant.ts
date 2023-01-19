export const TOOL_URL_PREFIX = '/tool';
export const TOOL_LINKS = Object.freeze([
  {
    label: '电商优惠券',
    url: TOOL_URL_PREFIX + '/shopping',
    title: '电商优惠券',
    changefreq: 'weekly',
    priority: 0.7
  },
  {
    label: 'MD5加密',
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

export const TOOL_PAGE_DESCRIPTION =
  '百宝箱收藏了众多互联网好物，包括支付宝红包、网购优惠券等省钱工具，MD5 加密工具，网址导航等。';
export const TOOL_PAGE_KEYWORDS = Object.freeze([
  '支付宝红包',
  '优惠券',
  '电商优惠券',
  '京东优惠券',
  '天猫优惠券',
  '淘宝优惠券',
  '省钱工具',
  'MD5加密',
  '加密工具',
  '效率工具',
  '学习工具'
]);

export const SHOPPING_PAGE_DESCRIPTION =
  '电商优惠券栏目提供京东、天猫、唯品会、拼多多、美团、饿了么等电商平台的各种优惠券、红包，' +
  '您可在线领取想要购买商品的优惠券，并参与各种优惠活动，实现专属于您的超级网购省钱计划。';
export const SHOPPING_PAGE_KEYWORDS = Object.freeze([
  '京东优惠券',
  '大额优惠券',
  '天猫优惠券',
  '美团优惠券',
  '拼多多优惠券',
  '京享红包',
  '网购省钱计划',
  '京东省钱计划',
  '京东好物',
  '京东联盟',
  '京东推客',
  '淘宝客'
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

export const MURMURHASH_PAGE_DESCRIPTION = 'MurmurHash 在线哈希工具，在线实现 MurmurHash 一致性哈希算法，轻松计算、复制 MurmurHash 结果。';
export const MURMURHASH_PAGE_KEYWORDS = Object.freeze([
  'MurmurHash',
  'Murmur哈希',
  '一致性哈希',
  'MurmurHash工具',
  'Murmur哈希工具',
  'MurmurHash在线哈希工具',
  'MurmurHash算法'
]);
