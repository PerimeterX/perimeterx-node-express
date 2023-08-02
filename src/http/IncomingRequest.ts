import {
    CONTENT_TYPE_HEADER_NAME,
    HttpMethod,
    IFormData,
    IHeaders,
    IIncomingRequest,
    MultipartFormDataUtils,
} from "perimeterx-js-core";
import {AsyncOrSync} from "ts-essentials";
import {Headers} from "./Headers";
import {Req} from "../types/Types";

// TODO: body parsing in express is done by middlewares.
//       need to check how to integrate with them properly.
export class IncomingRequest implements IIncomingRequest<Req> {
    private readonly request: Req;
    readonly headers: IHeaders;

    constructor(event: Req) {
        this.request = event;
        this.headers = new Headers(this.request);
    }

    get body(): string | undefined {
        return null;
    }

    get method(): HttpMethod {
        return this.request.method.toUpperCase() as HttpMethod
    }

    get url(): string {
        return this.request.protocol + '://' + this.request.get('host') + this.request.originalUrl;

    }

    get clientIP(): string | null {
        return this.request.get('x-forwarded-for') || this.request.socket.remoteAddress
    }

    async formData(): Promise<IFormData> {
        return MultipartFormDataUtils.createFormDataWithoutFiles(
            await this.text(),
            this.headers.get(CONTENT_TYPE_HEADER_NAME)
        );
    }

    async formUrlEncoded(): Promise<URLSearchParams> {
        return new URLSearchParams(await this.text());
    }

    getUnderlyingRequest(): Req {
        return this.request;
    }

    async json(): Promise<any> {
        if(/application\/json/.test(this.request.get(CONTENT_TYPE_HEADER_NAME))) {
            return this.request.body
        }

        return {};
    }

    text(): AsyncOrSync<string> {
        if(typeof this.body === 'string') {
            return this.request.body
        }
        return ""
    }
}
