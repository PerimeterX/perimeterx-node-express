import {
  DefaultContext,
  IConfiguration,
  IIncomingRequest,
  UuidRequestIdGenerator,
} from "perimeterx-js-core";
import { Req, Res } from "./types/Types";

export class Context extends DefaultContext<Req, Res> {
  constructor(
    config: IConfiguration<Req, Res>,
    request: IIncomingRequest<Req>
  ) {
    super(config, request, {
      // TODO: may modify fields here
      requestIdGenerator: new UuidRequestIdGenerator(),
    });
  }
}
