interface QuerySettings {
    url: 'account' | 'search' | 'flows' | 'reviews' | 'login' | 'register' | 'daily';
    method: 'GET' | 'POST';
    data?: Object;
    timeout?: number;
    json?: boolean;
    success: CallableFunction;
    error: CallableFunction;
}
declare const flowshareURLs: {
    homepage: string;
    homepageDir: string;
    api: string;
};
/**
 * Send a custom ajax request
 * @param params
 */
declare const ajaxRequest: (params: QuerySettings) => void;
