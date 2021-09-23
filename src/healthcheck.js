import http from 'http';

/**
 * @param url {string}
 * @returns {Promise<{status: number, body: string}>}
 */
export function httpGet(url) {
    return new Promise((resolve, reject) => {
        let options = {
            timeout: 1000,
        };
        http.get(url, options, response => {
            let body = '';
            response.on('data', chunk => {
                body += chunk;
            });
            response.on('error', reject);
            response.on('end', () => {
                resolve({
                    status: response.statusCode,
                    body: body,
                });
            });
        }).on('error', reject);
    });
}
