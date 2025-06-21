import { NextFunction, Request, Response } from 'express';

export const allowedCrawlers = [
  /Googlebot/i,
  /AdsBot-Google/i,
  /Mediapartners-Google/i,
  /APIs-Google/i,
  /GoogleAdSenseInfeed/i,
  /Storebot-Google/i,
  /Google-InspectionTool/i,
  /GoogleOther/i,
  /Bingbot/i,
  /AdIdxBot/i,
  /Baiduspider/i,
  /Baidu-imagespider/i,
  /Sogou/i,
  /360Spider/i,
  /ShenmaSpider/i,
  /YandexBot/i,
  /YandexImages/i,
  /DuckDuckBot/i,
  /Slurp/i,
  /NaverBot/i,
  /Exabot/i,
  /Twitterbot/i,
  /Facebot/i,
  /Applebot/i,
  /Amazonbot/i
];
export const commonCrawlers = /bot|crawl|spider|http|lighthouse|scan|search/i;
export const otherCrawlers = [
  / daum[ /]/i,
  / deusu\//i,
  / yadirectfetcher/i,
  /(?:^|[^g])news(?!sapphire)/i,
  /(?<![hg]m)score/i,
  /@[a-z][\w-]+\./i,
  /\(\)/i,
  /\.com\b/i,
  /\btime\//i,
  /\|/i,
  /^</i,
  /^[\w .\-(?:)%]+(?:\/v?\d+(?:\.\d+)?(?:\.\d{1,10})*?)?(?:,|$)/i,
  /^[^ ]{50,}$/i,
  /^\d+\b/i,
  /^\w+\/[\w()]*$/i,
  /^active/i,
  /^ad muncher/i,
  /^amaya/i,
  /^avsdevicesdk\//i,
  /^biglotron/i,
  /^bw\//i,
  /^clamav[ /]/i,
  /^client\//i,
  /^cobweb\//i,
  /^custom/i,
  /^ddg[_-]android/i,
  /^discourse/i,
  /^dispatch\/\d/i,
  /^downcast\//i,
  /^email/i,
  /^facebook/i,
  /^getright\//i,
  /^gozilla\//i,
  /^hobbit/i,
  /^hotzonu/i,
  /^hwcdn\//i,
  /^igetter\//i,
  /^jeode\//i,
  /^jetty\//i,
  /^jigsaw/i,
  /^microsoft bits/i,
  /^movabletype/i,
  /^mozilla\/\d\.\d\s[\w.-]+$/i,
  /^mozilla\/\d\.\d\s\(compatible;?(?:\s\w+\/\d+\.\d+)?\)$/i,
  /^navermailapp/i,
  /^netsurf/i,
  /^offline/i,
  /^openai\//i,
  /^owler/i,
  /^php/i,
  /^postman/i,
  /^python/i,
  /^rank/i,
  /^read/i,
  /^reed/i,
  /^rest/i,
  /^rss/i,
  /^snapchat/i,
  /^space bison/i,
  /^svn/i,
  /^swcd /i,
  /^taringa/i,
  /^thumbor\//i,
  /^track/i,
  /^w3c/i,
  /^webbandit\//i,
  /^webcopier/i,
  /^wget/i,
  /^whatsapp/i,
  /^wordpress/i,
  /^xenu link sleuth/i,
  /^yahoo/i,
  /^yandex/i,
  /^zdm\/\d/i,
  /^zoom marketplace\//i,
  /^{{.*}}$/i,
  /analyzer/i,
  /archive/i,
  /ask jeeves\/teoma/i,
  /audit/i,
  /bit\.ly\//i,
  /bluecoat drtr/i,
  /browsex/i,
  /burpcollaborator/i,
  /capture/i,
  /catch/i,
  /check\b/i,
  /checker/i,
  /chromeframe/i,
  /classifier/i,
  /cloudflare/i,
  /convertify/i,
  /cypress\//i,
  /dareboost/i,
  /datanyze/i,
  /dejaclick/i,
  /detect/i,
  /dmbrowser/i,
  /download/i,
  /evc-batch\//i,
  /exaleadcloudview/i,
  /feed/i,
  /firephp/i,
  /functionize/i,
  /gomezagent/i,
  /grab/i,
  /headless/i,
  /httrack/i,
  /hubspot marketing grader/i,
  /hydra/i,
  /ibisbrowser/i,
  /infrawatch/i,
  /insight/i,
  /inspect/i,
  /iplabel/i,
  /ips-agent/i,
  /java(?!;)/i,
  /library/i,
  /linkcheck/i,
  /mail\.ru\//i,
  /manager/i,
  /measure/i,
  /neustar wpm/i,
  /node/i,
  /nutch/i,
  /offbyone/i,
  /onetrust/i,
  /optimize/i,
  /pageburst/i,
  /pagespeed/i,
  /parser/i,
  /perl/i,
  /phantomjs/i,
  /pingdom/i,
  /powermarks/i,
  /preview/i,
  /proxy/i,
  /ptst[ /]\d/i,
  /retriever/i,
  /rexx;/i,
  /rigor/i,
  /rss\b/i,
  /scrape/i,
  /server/i,
  /sparkler\//i,
  /speedcurve/i,
  /splash/i,
  /statuscake/i,
  /supercleaner/i,
  /synapse/i,
  /synthetic/i,
  /tools/i,
  /torrent/i,
  /transcoder/i,
  /url/i,
  /validator/i,
  /virtuoso/i,
  /wappalyzer/i,
  /webglance/i,
  /webkit2png/i,
  /whatcms\//i,
  /xtate\//i
];

export const disallowedReferrers = ['ntp.msn.cn'];

export function isAllowedCrawler(ua: string): boolean {
  return allowedCrawlers.some((pattern) => pattern.test(ua));
}

export function isDisallowedCrawler(ua: string): boolean {
  return commonCrawlers.test(ua) || otherCrawlers.some((pattern) => pattern.test(ua));
}

export function isDisallowedReferrer(referrer: string) {
  const domainReg = /^https?:\/\/([^\/]+)/i;
  const referrerDomain = referrer.match(domainReg)?.[1] || '';

  return !!referrerDomain && disallowedReferrers.some((item) => item === referrerDomain);
}

export function antiCrawlers(req: Request, res: Response, next: NextFunction) {
  const ua = req.headers['user-agent'] || '';
  const host = req.headers.host;
  const accept = req.headers.accept;

  if (!ua || !host || !accept) {
    return res.status(400).send('Bad Request.');
  }

  const referrer: string = req.headers['referer'] || <string>req.headers['referrer'] || '';
  const isAllowed = isAllowedCrawler(ua);
  const isCrawler = (!isAllowed && isDisallowedCrawler(ua)) || isDisallowedReferrer(referrer);

  if (isCrawler) {
    return res.status(403).send('Forbidden.');
  }

  return next();
}
