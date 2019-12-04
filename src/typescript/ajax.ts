interface QuerySettings {
    url: 'account' | 'search' | 'flows' | 'reviews' | 'login' | 'register' | 'daily';
    method: 'GET' | 'POST';
    data?: Object;
    timeout?: number;
    json?: boolean;
    success: (data: any) => void;
    error: (error: any) => void;
}


const flowshareURLs = {
    homepage: 'https://rasphost.com/flowshare/web/test/home/',
    homepageDir: '/flowshare/web/test/home/',
    api: 'https://rasphost.com/flowshare/',
};

/**
 * Send a custom ajax request
 * @param params
 */
const ajaxRequest = (params: QuerySettings) => {
    let { data, error, json, method, timeout, url: path } = params;
    $.ajax({
        url: `${flowshareURLs.api}${path}.php`,
        method,
        data,
        timeout,
        error: res => {
            console.error('Ajax error', res);
            error(res);
        },
        success: (res: string) => {
            let data: any = res;
            if (json)
                try {
                    data = JSON.parse(res);
                } catch (e) {
                    console.error('JSON parse error', e);
                }
            params.success(<string>data);
        },
    });
};
