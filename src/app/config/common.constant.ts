import { environment } from '../../environments/environment';

export const APP_ID = environment.appId;

export const REGEXP_ID = /^[0-9a-zA-Z]{16}$/i;
export const REGEXP_PAGE_NAME = /^[a-zA-Z0-9]+(?:[~@$%&*\-_=+;:,]+[a-zA-Z0-9]+)*$/i;
export const REGEXP_IP = /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/;

export const PAGE_PREFIX_BLACKLIST = Object.freeze(['post', 'wallpaper', 'user', 'tool']);

export const ADMIN_URL_PARAM = '?token=$0&appId=$1';

export const COOKIE_KEY_THEME = 'theme';
export const COOKIE_KEY_UV_ID = 'faid';
export const COOKIE_KEY_USER_ID = 'uid';
export const COOKIE_KEY_USER_NAME = 'user';
export const COOKIE_KEY_USER_TOKEN = 'token';

export const MEDIA_QUERY_THEME_DARK = '(prefers-color-scheme: dark)';
export const MEDIA_QUERY_THEME_LIGHT = '(prefers-color-scheme: light)';

export const MAX_IP_VALUE = 4294967295;
