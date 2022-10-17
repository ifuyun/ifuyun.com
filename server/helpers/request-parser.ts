import { Request, Response } from 'express';

export function getIP(req: Request): string {
  return <string>(
    (req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.ip || (req.socket && req.socket.remoteAddress))
  );
}

export function getIPAndUserAgent(req: Request): string {
  return getIP(req) + ' - "' + req.headers['user-agent'] + '"';
}

export function parseRequestHeader(req: Request, res: Response) {
  return {
    ip: getIP(req),
    url: req.originalUrl || req.url,
    protocol: req.protocol,
    hostname: req.hostname,
    method: req.method,
    status: res.statusCode,
    date: new Date().toUTCString(),
    referrer: req.headers.referer || req.headers['referrer'] || '',
    httpVersion: `${req.httpVersionMajor}.${req.httpVersionMinor}`,
    userAgent: req.headers['user-agent'],
    contentLength: res.getHeader('content-length') || req.headers['Content-Length'] || '-'
  };
}
