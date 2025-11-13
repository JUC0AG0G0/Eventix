import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { JwtPayload as JwtPayloadFromAuth } from "../../auth/strategies/jwt.strategy";

export type JwtPayload = JwtPayloadFromAuth; // ⚡ export ici

export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext): JwtPayload => {
	const request = ctx.switchToHttp().getRequest();
	return request.user;
});
