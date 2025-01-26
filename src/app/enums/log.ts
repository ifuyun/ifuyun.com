export enum ActionObjectType {
  POST = 'post',
  WALLPAPER = 'wallpaper',
  GAME = 'game',
  SEARCH = 'search',
  TOOL_LIST = 'tool_list',
  COMMENT = 'comment',
  USER = 'user',
  HEADER = 'header',
  SIDER = 'sider',
  CAROUSEL = 'carousel',
  ADS = 'ads'
}

export enum ActionType {
  // post
  COPY_CODE = 'copy_code',
  // widget
  SHOW_RED_PACKET = 'show_red_packet',
  SHOW_WALLPAPER_MODAL = 'show_wallpaper_modal',
  SHOW_WECHAT_CARD = 'show_wechat_card',
  OPEN_POST_RSS = 'open_post_rss',
  OPEN_WALLPAPER_RSS = 'open_wallpaper_rss',
  // setting
  CHANGE_THEME = 'change_theme',
  CHANGE_LANG = 'change_lang',
  // carousel
  CLICK_CAROUSEL = 'click_carousel',
  CLICK_CAROUSEL_ADS = 'click_carousel_ads'
}
