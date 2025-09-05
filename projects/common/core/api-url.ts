export enum ApiUrl {
  // search
  SEARCH_ALL = '/search',
  SEARCH_POSTS = '/search/posts',
  SEARCH_WALLPAPERS = '/search/wallpapers',
  SEARCH_GAMES = '/search/games',
  // option
  OPTION = '/options/option',
  OPTION_FRONTEND = '/options/frontend',
  OPTION_CAROUSELS = '/options/carousels',
  // sitemap
  SITEMAP_POST = '/posts/post-sitemap',
  SITEMAP_PAGE = '/posts/page-sitemap',
  SITEMAP_WALLPAPER = '/wallpapers/sitemap',
  SITEMAP_GAME = '/games/sitemap',
  // post
  POSTS = '/posts',
  POST = '/posts/post',
  POST_HOT = '/posts/hot',
  POST_RANDOM = '/posts/random',
  POST_RELATED = '/posts/related',
  POST_LIST_BY_BOOK = '/posts/list-by-book',
  POST_LIST_FOR_RSS = '/posts/list-for-rss',
  POST_PREV_AND_NEXT = '/posts/prev-and-next',
  POST_ARCHIVES = '/posts/archives',
  // taxonomy
  TAXONOMY_TREE = '/taxonomies/taxonomy-tree',
  // link
  LINK_FOOTER = '/links/footer',
  LINK_FRIEND = '/links/friend',
  LINK_FAVORITE = '/links/favorites',
  // comment
  COMMENTS = '/comments',
  COMMENT = '/comments/comment',
  // vote
  VOTE = '/votes/vote',
  // user
  USER_LOGIN = '/users/login',
  USER_LOGOUT = '/users/logout',
  USER_SIGNUP = '/users/signup',
  USER_VERIFY = '/users/verify',
  USER_RESEND_CODE = '/users/resend',
  USER_THIRD_LOGIN = '/users/third-login',
  USER_LOGIN_INFO = '/users/login-user',
  USER_SIGNUP_INFO = '/users/signup-user',
  // favorite
  FAVORITE = '/favorites/favorite',
  // log
  ACCESS_LOG = '/access-logs/access',
  ACCESS_LOG_LEAVE = '/access-logs/leave',
  ACCESS_LOG_CHECK_LIMIT = '/access-logs/check-limit',
  ACCESS_LOG_PLUGIN = '/access-logs/plugin',
  ACTION_LOG = '/action-logs/action',
  // wallpaper
  WALLPAPERS = '/wallpapers',
  WALLPAPER_HOT = '/wallpapers/hot',
  WALLPAPER_RANDOM = '/wallpapers/random',
  WALLPAPER_RELATED = '/wallpapers/related',
  WALLPAPER_PREV_AND_NEXT = '/wallpapers/prev-and-next',
  WALLPAPER = '/wallpapers/wallpaper',
  WALLPAPER_ARCHIVES = '/wallpapers/archives',
  WALLPAPER_DOWNLOAD_URL = '/wallpapers/download-url',
  // jigsaw
  JIGSAW_START = '/jigsaws/start',
  JIGSAW_COMPLETE = '/jigsaws/complete',
  JIGSAW_PROGRESS = '/jigsaws/progress',
  JIGSAW_HOT = '/jigsaws/hot',
  JIGSAW_RANKINGS = '/jigsaws/rankings',
  // nes
  GAMES = '/games',
  GAME = '/games/game',
  GAME_ROM = '/games/rom',
  GAME_HOT = '/games/hot',
  GAME_RANDOM = '/games/random',
  GAME_RECENT = '/games/recent',
  GAME_RELATED = '/games/related',
  GAME_PREV_AND_NEXT = '/games/prev-and-next',
  GAME_LOG = '/games/log',
  GAME_CHECK_PLAY = '/games/check-play',
  GAME_DOWNLOAD_URL = '/games/download-url',
  // conversation
  CONVERSATION = '/conversations/conversation',
  CONVERSATION_ASK_AI = '/conversations/ask-ai',
  // message
  BOT_MESSAGES = '/messages',
  BOT_MESSAGE_VOTE = '/messages/vote',
  BOT_MESSAGE_USAGE = '/messages/usage',
  // chat
  CHAT_STREAM = '/chat/stream',
  CHAT_MESSAGE = '/chat/message',
  CHAT_POST_ASK = '/chat/post-ask',
  CHAT_WALLPAPER_ASK = '/chat/wallpaper-ask',
  // util
  UTIL_TURNSTILE_VERIFY = '/util/turnstile',
  // jd
  JD_SELLING_PROMOTION = '/union/jd/selling-promotion',
  JD_PROMOTION_COMMON = '/union/jd/promotion-common',
  JD_GOODS_MATERIAL = '/union/jd/goods-material',
  JD_GOODS_JINGFEN = '/union/jd/goods-jingfen',
  // tool
  TOOL_BASE64 = '/tool/base64',
  TOOL_MD5 = '/tool/md5',
  // app
  TENANT_APP = '/apps/app',
  // IP
  IP_SEARCH = '/ips/search'
}
