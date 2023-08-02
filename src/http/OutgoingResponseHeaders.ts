import {IHeaders} from "perimeterx-js-core";
import {Res} from "../types/Types";

export class OutgoingResponseHeaders implements IHeaders {
    private res: Res;

    constructor(res: Res) {
        this.res = res;

    }

    append(name: string, value: string): void {
        this.res.headers[name] = [...(this.res.headers[name] || []), value]
    }

    delete(name: string): void {
        delete this.res.headers[name]
    }

    forEach(callbackfn: (value: string, key: string, parent: IHeaders) => void, thisArg?: any): void {
        Object.keys(this.res.headers)
            .filter(this.has)
            .map(name => [name, this.get(name)])
            .forEach(([name, value]) => callbackfn(value, name, this))
    }

    get(name: string): string | null {
        return (this.res.headers[name] || []).join(";") || null
    }

    has(name: string): boolean {
        return !!this.get(name);
    }

    set(name: string, value: string): void {
        this.res.headers[name] = [value]
    }

}