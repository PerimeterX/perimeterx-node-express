import {
  BufferBase64Utils, CryptoCipherUtils, CryptoHashUtils, CryptoHmacUtils, DefaultIpRangeChecker,
  EnforcerBase,
  IConfiguration,
  IContext,
  IMinimalResponse,
  IOutgoingResponse, PhinHttpClient, SubtleCryptoCipherUtils,
  TokenVersion,
  toMutableHeaders
} from "perimeterx-js-core";
import { Context } from "./Context";
import { Req, Res } from "./types/Types";
import { IncomingRequest } from "./http/IncomingRequest";
import {OutgoingResponse} from "./http/OutgoingResponse";

export class Enforcer extends EnforcerBase<
  TokenVersion.V3,
  Req,
  Res,
  [Req],
  [Req, Res]
> {
  private context: IContext<Req, Res> = undefined;

  constructor(config: IConfiguration<Req, Res>) {
    super(config, {
      tokenVersion: TokenVersion.V3,
      cipherUtils: new CryptoCipherUtils(),
      base64Utils: new BufferBase64Utils(),
      hmacUtils: new CryptoHmacUtils(),
      hashUtils: new CryptoHashUtils(),
      ipRangeChecker: new DefaultIpRangeChecker(),
      httpClient: new PhinHttpClient(),
    });
  }

  protected async convertToRes(response: IMinimalResponse): Promise<Res> {
    return {
      headers: toMutableHeaders(response.headers),
      body: response.body,
      status: response.status
    }
  }

  protected constructContext(request: Req): IContext<Req, Res> {
    return new Context(this.config, new IncomingRequest(request));
  }

  protected async convertToOutgoingResponse(
    req: Req,
    res: Res
  ): Promise<IOutgoingResponse<Res>> {
    return new OutgoingResponse(res);
  }

  protected preserveContext(context: IContext<Req, Res>, req: Req): void {
    this.context = context;
  }

  protected retrieveContext(req: Req, res: Res): IContext<Req, Res> | null {
    return this.context || null;
  }
}
