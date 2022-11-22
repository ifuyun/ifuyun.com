export interface JdUnionResponse {
  code: number; //返回码
  message: string; //返回消息
  requestId?: string;
}

export interface JdUnionResponsePromotion extends JdUnionResponse {
  data: {
    clickURL: string;
    shortURL: string;
  };
}

export interface JdUnionParamGoodsMaterial {
  eliteId: number; //频道ID：1.猜你喜欢、2.实时热销、3.大额券、4.9.9包邮、1001.选品库
  page?: number;
  pageSize?: number;
  hasCoupon?: number; //1：只查询有最优券商品，不传值不做限制
  groupId?: number; //选品库id（仅对eliteId=1001有效，且必传）
  transfer?: 0 | 1; //是否强制转链，默认返回的长链为移动端地址，针对PC端需要再重新转换一次
}

export interface JdUnionCoupon {
  bindType: number; //券种类 (优惠券种类：0 - 全品类，1 - 限品类（自营商品），2 - 限店铺，3 - 店铺限商品券)
  discount: number; //券面额
  link: string; //券链接
  platformType: number; //券使用平台 (平台类型：0 - 全平台券，1 - 限平台券)
  quota: number; //券消费限额
  getStartTime: number; //领取开始时间(时间戳，毫秒)
  getEndTime: number; //券领取结束时间(时间戳，毫秒)
  useStartTime: number; //券有效使用开始时间(时间戳，毫秒)
  useEndTime: number; //券有效使用结束时间(时间戳，毫秒)
  isBest: number; //最优优惠券，1：是；0：否，购买一件商品可使用的面额最大优惠券
}

export interface JdUnionGoodsImage {
  url: string; //图片链接地址，第一个图片链接为主图链接
}

export interface JdUnionGoodsVideo {
  width: number; //宽
  high: number; //高
  imageUrl: string; //视频图片地址
  videoType: number; //1:主图，2：商详
  playType: string; //low：标清，high：高清
  duration: number; //时长(单位:s)
  playUrl: string; //播放地址
}

export interface JdUnionPromotionLabel {
  promotionLabel: string; //商品促销文案
  labelName: string; //促销标签名称
  startTime: number; //促销开始时间
  endTime: number; //促销结束时间
  promotionLabelId: number; //促销ID
}

export interface JdUnionGoodsMaterial {
  addCartPrice: number; //预留字段
  bestCoupon: JdUnionCoupon | null;
  bookInfo: {
    //图书信息
    isbn: string; //图书编号
  };
  brandCode: string; //
  brandName: string; //品牌名
  categoryInfo: {
    //类目信息
    cid1: number; //一级类目ID
    cid1Name: string; //一级类目名称
    cid2: number; //二级类目ID
    cid2Name: string; //二级类目名称
    cid3: number; //三级类目ID
    cid3Name: string; //三级类目名称
  };
  comments: number; //评论数
  commissionInfo: {
    //佣金信息
    commission: number; //佣金
    commissionShare: number; //佣金比例
    couponCommission: number; //券后佣金，（促销价-优惠券面额）*佣金比例
    plusCommissionShare: number; //plus佣金比例，plus用户购买推广者能获取到的佣金比例
  };
  couponInfo: {
    //优惠券信息，返回内容为空说明该SKU无可用优惠券
    couponList: JdUnionCoupon[];
  };
  deliveryType: number; //京东配送 1：是，0：不是
  forbidTypes: number[]; //0普通商品，10微信京东购物小程序禁售，11微信京喜小程序禁售
  goodCommentsShare: number; //商品好评率
  imageInfo: {
    //图片信息
    imageList: JdUnionGoodsImage[]; //图片合集
    whiteImage: string; //白底图
  };
  inOrderCount30Days: number; //30天引单数量
  inOrderCount30DaysSku: number; //30天引单数量(sku维度)
  jxFlags: number[]; //京喜商品类型，1京喜、2京喜工厂直供、3京喜优选
  materialUrl: string; //落地页
  owner: string; //g=自营，p=pop
  pinGouInfo: {
    //拼购信息
    pingouPrice: number; //拼购价格
    pingouTmCount: number; //拼购成团所需人数
    pingouUrl: string; //拼购链接
    pingouStartTime: number; //拼购开始时间(时间戳，毫秒)
    pingouEndTime: number; //拼购结束时间(时间戳，毫秒)
  };
  preSaleInfo: {
    //预售信息
    currentPrice: number; //预售价格
    earnest: number; //订金金额（定金不能超过预售总价的20%）
    preSalePayType: number; //预售支付类型：1.仅全款 2.定金、全款均可 5.一阶梯仅定金
    discountType: number; //1: 定金膨胀 2: 定金立减
    preAmountDeposit: number; //立减金额
    preSaleStartTime: number; //定金开始时间
    preSaleEndTime: number; //定金结束时间
    balanceStartTime: number; //尾款开始时间
    balanceEndTime: number; //尾款结束时间
    shipTime: number; //预计发货时间
    preSaleStatus: number; //预售状态（0 未开始；1 预售中；2 预售结束；3 尾款进行中；4 尾款结束）
    amountDeposit: number; //定金膨胀金额（定金可抵XXX）
  };
  priceInfo: {
    price: number; //商品价格
    lowestPrice: number; //促销价
    lowestPriceType: number; //促销价类型，1：商品价格；2：拼购价格； 3：秒杀价格； 4：预售价格
    lowestCouponPrice: number; //券后价（有无券都返回此字段）
  };
  promotionInfo: {
    //推广信息
    clickURL: string; //长链推广（转链长链接，无需调用转链接口）
  };
  promotionLabelInfoList: JdUnionPromotionLabel[]; //商品促销标签集
  reserveInfo: {
    //预约信息
    price: number; //预约价格
    type: number; //预约类型： 1：预约购买资格（仅预约的用户才可以进行购买）； 5：预约抽签（仅中签用户可购买）
    status: number; //1：等待预约 2：预约中 3：等待抢购/抽签中 4：抢购中 5：抢购结束
    startTime: number; //预定开始时间
    endTime: number; //预定结束时间
    panicBuyingStartTime: number; //抢购开始时间
    panicBuyingEndTime: number; //抢购结束时间
  };
  resourceInfo: {
    //资源信息
    eliteId: number; //频道id
    eliteName: string; //频道名称
  };
  shopInfo: {
    //店铺信息
    shopName: string; //店铺名称（或供应商名称）
    shopId: number; //店铺Id
    shopLevel: number; //店铺评分
    shopLabel: string; //1：京东好店
    userEvaluateScore: string; //用户评价评分（仅pop店铺有值）
    commentFactorScoreRankGrade: string; //用户评价评级（仅pop店铺有值）
    logisticsLvyueScore: string; //物流履约评分（仅pop店铺有值）
    logisticsFactorScoreRankGrade: string; //物流履约评级（仅pop店铺有值）
    afterServiceScore: string; //售后服务评分（仅pop店铺有值）
    afsFactorScoreRankGrade: string; //售后服务评级（仅pop店铺有值）
    scoreRankRate: string; //店铺风向标（仅pop店铺有值）
  };
  skuId: number; //商品ID
  skuLabelInfo: {
    is7ToReturn: number; //0：不支持； 1或null：支持7天无理由退货； 2：支持90天无理由退货； 4：支持15天无理由退货； 6：支持30天无理由退货；
    fxg: number; //1：放心购商品
    //放心购商品子标签集合
    fxgServiceList: {
      serviceName: string; //服务名称
    }[];
  };
  skuName: string; //商品名称
  spuid: number; //spuid，其值为同款商品的主skuid
  seckillInfo: {
    //秒杀信息
    seckillOriPrice: number; //秒杀价原价
    seckillPrice: number; //秒杀价
    seckillStartTime: number; //秒杀开始时间(时间戳，毫秒)
    seckillEndTime: number; //秒杀结束时间(时间戳，毫秒)
  };
  videoInfo: {
    //视频信息
    videoList: JdUnionGoodsVideo[]; //视频集合
  };
}

export interface JdUnionResponseGoodsMaterial extends JdUnionResponse {
  data: JdUnionGoodsMaterial[];
  totalCount: number; //有效商品总数量
}
