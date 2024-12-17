export const USER_EMAIL_LENGTH = 100;
export const USER_PASSWORD_PATTERN = /^[\x20-\x7e]+$/i;
export const USER_PASSWORD_MIN_LENGTH = 8;
export const USER_PASSWORD_MAX_LENGTH = 32;

export const THIRD_LOGIN_API: Record<string, string> = Object.freeze({
  wechat: '',
  qq: '',
  alipay:
    'https://openauth.alipay.com/oauth2/publicAppAuthorize.htm?app_id=$0&scope=auth_user&redirect_uri=$1&state=$2',
  weibo: 'https://api.weibo.com/oauth2/authorize?client_id=$0&response_type=code&redirect_uri=$1&state=$2',
  github: 'https://github.com/login/oauth/authorize?client_id=$0&redirect_uri=$1&state=$2'
});
