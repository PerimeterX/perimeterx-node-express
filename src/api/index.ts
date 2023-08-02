import {ConfigurationParams, ReadonlyHeaders} from "perimeterx-js-core";
import {Req, Res} from "../types/Types";
import {Request, Router} from "express";
import {Enforcer} from "../Enforcer";
import {Config} from "../Configuration";
import {AsyncOrSync} from "ts-essentials";
import {EnforcerResponse} from "../types/EnforcerResponse";
import {Response} from 'express'

const postRequest = async (enforcer: Enforcer, req: Request, res: Response) => {
    const headers = getHeaders(res)

    await enforcer.postEnforce(req, new EnforcerResponse({
        status: res.statusCode,
        headers: headers,
        body: null
    }))
}

 const handleEnforcerResponse = async (enforcerResponse: EnforcerResponse,
                                      req: Request,
                                      res: Response,
                                      options: PXOptions) => {
    for (const headerName in enforcerResponse.headers) {
        res.setHeader(headerName, enforcerResponse.headers[headerName])
    }
    res.status(enforcerResponse.status);

    if (options.responseModifier) {
        options.responseModifier(req, res)
    }

    let body = enforcerResponse.body
    if (options.responseBodyModifier) {
        body = await options.responseBodyModifier(req, body)
    }

    res.send(body)
}

export type PXOptions = ConfigurationParams<Req, Res> & {
    responseModifier?: (req: Request, res: Response) => AsyncOrSync<void>
    responseBodyModifier?: (req: Request, body: any) => AsyncOrSync<any>
}

export const router = (options: PXOptions): Router => {
    const router = Router()
    const config = new Config(options);
    router.use("*", async (req, res, next) => {
        const enforcer = new Enforcer(config);
        const enforcerResponse = await enforcer.enforce(req);
        res.on("finish", async () => await postRequest(enforcer, req, res))

        if (enforcerResponse) {
            await handleEnforcerResponse(enforcerResponse, req, res, options);
        } else {
            return next()
        }
    })
    return router
}

const getHeaders = (res: Response): ReadonlyHeaders => {
    return Object.fromEntries(Object.entries(res.getHeaders())
        .filter(([name, value]) => value)
        .map(([name, value]) => {
            if (Array.isArray(value)) return [name, value.filter(v => v).map(v => v.toString())]
            else return [name, [value.toString()]]
        })
    )
}
