import {IHeaders, IOutgoingResponse} from "perimeterx-js-core";
import {Res} from "../types/Types";
import {OutgoingResponseHeaders} from "./OutgoingResponseHeaders";

export class OutgoingResponse implements IOutgoingResponse<Res> {
    private res: Res;
    constructor(res: Res) {
        this.res = res
        this.body = res.body
        this.status = res.status
        this.headers = new OutgoingResponseHeaders(res)
    }

    readonly body: any;
    readonly headers: IHeaders | null;
    readonly status: number | null;

    getUnderlyingResponse(): Res {
        return undefined;
    }

}