import http from 'http';

export function httpGet(url: string): Promise<{ status: number; body: string; }> {
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
                    status: response.statusCode ?? 0,
                    body: body,
                });
            });
        }).on('error', reject);
    });
}
