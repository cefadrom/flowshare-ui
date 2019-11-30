interface Flow {
    id: string;
    date: string;
    user: string;
    userid: string;
    title: string;
    description: string;
    ratings: string;
    downloads: string;
    lastmodified: string;
}
interface AccountData {
    error?: string;
    id: string;
    coins: string;
    username: string;
    password: string;
    email: string;
    token: string;
    flows: null | Flow[];
    priv: string;
    ip: string;
    banned: string;
    verified: string;
    daily: string;
}
interface FlowReview {
    userid: string;
    date: string;
    username: string;
    comment: string;
    isedited: '0' | '1';
}
