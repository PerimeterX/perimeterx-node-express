import {ReadonlyHeaders} from "perimeterx-js-core";

type ResponseOptions = {
    status: number,
    headers: Record<string, string[]>
}
export class EnforcerResponse {
    readonly body: any;
    readonly headers: Record<string, string[]>;
    readonly status: number;

    constructor(body: any, options?: ResponseOptions) {
        this.body = body
        this.status = options?.status || 200
        this.headers = options?.headers || {}
    }
}