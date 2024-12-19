export enum ActionObjectType {
  POST = 'post',
  POST_LIST = 'post_list',
  WALLPAPER = 'wallpaper',
  WALLPAPER_LIST = 'wallpaper_list',
  COMMENT = 'comment',
  COMMENT_LIST = 'comment_list',
  USER = 'user',
  HEADER = 'header',
  SIDER = 'sider',
  TOOL_LIST = 'tool_list',
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
  // user
  UPDATE_INFO = 'update_info',
  UPDATE_PASSWORD = 'update_password',
  // widget
  SHOW_RED_PACKET = 'show_red_packet',
  SHOW_WALLPAPER_MODAL = 'show_wallpaper_modal',
  SHOW_WECHAT_CARD = 'show_wechat_card',
  SHOW_MINI_APP_CARD = 'show_mini_app_card',
  // rss
  OPEN_POST_RSS = 'open_post_rss',
  OPEN_WALLPAPER_RSS = 'open_wallpaper_rss',
  // search
  SEARCH = 'search',
  SEARCH_POST = 'search_post',
  SEARCH_WALLPAPER = 'search_wallpaper',
  // setting
  CHANGE_THEME = 'change_theme',
  CHANGE_LANG = 'change_lang',
  // carousel
  CLICK_CAROUSEL = 'click_carousel',
  CLICK_CAROUSEL_ADS = 'click_carousel_ads'
}
