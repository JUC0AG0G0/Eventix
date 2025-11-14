import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Request } from "express";
import { JwtPayload as JwtPayloadFromAuth } from "../../auth/strategies/jwt.strategy";

export type JwtPayload = JwtPayloadFromAuth;

export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext): JwtPayload => {
	const request = ctx.switchToHttp().getRequest<Request & { user: JwtPayload }>();

	return request.user;
});
