export enum ActionObjectType {
  POST = 'post',
  POST_LIST = 'post_list',
  WALLPAPER = 'wallpaper',
  WALLPAPER_LIST = 'wallpaper_list',
  COMMENT = 'comment',
  COMMENT_LIST = 'comment_list',
  USER = 'user',
  TOOLBOX = 'toolbox',
  CAROUSEL = 'carousel',
  SEARCH = 'search',
  SETTING = 'setting',
  ADS = 'ads'
}

export enum ActionType {
  // post
  COPY_CODE = 'copy_code',
  // wallpaper
  WALLPAPER_DOWNLOAD = 'download_wallpaper',
  TRANSLATE_WALLPAPER = 'translate_wallpaper',
  // wallpaper list
  CHANGE_WALLPAPER_LANG = 'change_wallpaper_lang',
  CHANGE_WALLPAPER_LIST_MODE = 'change_wallpaper_list_mode',
  // user
  LOGIN = 'login',
  LOGOUT = 'logout',
  REGISTER = 'register',
  CHANGE_INFO = 'change_info',
  CHANGE_PASSWORD = 'change_password',
  // toolbox
  SHOW_WALLPAPER_BOX = 'show_wallpaper_box',
  SHOW_WECHAT_CARD = 'show_wechat_card',
  SHOW_MINI_APP_CARD = 'show_mini_app_card',
  OPEN_RSS = 'open_rss',
  // search
  SEARCH = 'search',
  SEARCH_POST = 'search_post',
  SEARCH_WALLPAPER = 'search_wallpaper',
  // setting
  CHANGE_THEME = 'change_theme',
  CHANGE_LANG = 'change_lang',
  // ads
  CLICK_JD_UNION = 'click_jd_union',
  CLICK_JD_UNION_COUPON = 'click_jd_union_coupon',
  CLICK_ADSENSE = 'click_adsense',
  PROMOTE_JD_UNION = 'promote_jd_union',
  // carousel
  CLICK_CAROUSEL = 'click_carousel',
  CLICK_CAROUSEL_ADS = 'click_carousel_ads'
}
