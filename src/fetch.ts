import * as http from 'http';
import { ResponseCode } from './app/config/response-code.enum';
import { environment as env } from './environments/environment';

export function fetchJson(url: string): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    http
      .get(env.api.host + url, (res) => {
        const { statusCode } = res;
        const contentType = res.headers['content-type'] || '';

        let error;
        if (statusCode !== 200) {
          error = new Error('Request Failed.\n' + `Status Code: ${statusCode}`);
        } else if (!/^application\/json/.test(contentType)) {
          error = new Error('Invalid content-type.\n' + `Expected application/json but received ${contentType}`);
        }
        if (error) {
          reject(error);
          // Consume response data to free up memory
          res.resume();
          return;
        }

        res.setEncoding('utf8');
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          try {
            const parsedData = JSON.parse(rawData);
            if (parsedData.code !== ResponseCode.SUCCESS) {
              return reject(new Error(parsedData.message || 'Request Failed.'));
            }
            resolve(parsedData);
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('error', (e) => {
        reject(e);
      });
  });
}
