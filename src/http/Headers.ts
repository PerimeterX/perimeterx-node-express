import {IHeaders, PXDE_COOKIE_DELIMITER, SET_COOKIE_HEADER_NAME} from "perimeterx-js-core";
import {Req} from "../types/Types";

export class Headers implements IHeaders {
    private readonly request: Req;

    constructor(request: Req) {
        this.request = request;
    }

    append(name: string, value: string): void {
        const headerValue = this.getHeaderValue(name);
        this.request.headers[name] = [...headerValue, value]
    }

    delete(name: string): void {
        delete this.request.headers[name]
    }

    forEach(
        callbackfn: (value: string, key: string, parent: IHeaders) => void,
        thisArg?: any
    ): void {
        Object.keys(this.request.headers)
            .map(name => [name, this.get(name)])
            .forEach(([name, value]) => callbackfn(value, name, this))
    }

    get(name: string): string | null {
        return this.getHeaderValue(name).join(',') || null
    }

    has(name: string): boolean {
        return !!this.get(name)
    }

    set(name: string, value: string): void {
        this.request.headers[name] = value
    }

    private getHeaderValue(name: string): string[] {
        const value = this.request.headers[name];
        if(!value) {
            return []
        }

        if(Array.isArray(value)) {
            return value
        }

        return [value]
    }
}
