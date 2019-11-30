interface AccountCookie {
    token: string;
    username: string;
    expires: number;
    email: string;
}
interface LoginRequest {
    error?: string;
    response: string;
    token: string;
}
interface FlowUploadResult {
    error?: string;
    response: string;
    id: string;
}
