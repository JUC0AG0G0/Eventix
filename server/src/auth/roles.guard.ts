import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "./roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
	constructor(private readonly reflector: Reflector) {}

	private isStringArray(val: unknown): val is string[] {
		return Array.isArray(val) && val.every((v) => typeof v === "string");
	}

	canActivate(context: ExecutionContext): boolean {
		const requiredRoles = this.reflector.getAllAndOverride<string[] | undefined>(ROLES_KEY, [
			context.getHandler(),
			context.getClass(),
		]);

		if (!this.isStringArray(requiredRoles) || requiredRoles.length === 0) {
			return true;
		}

		const req = context.switchToHttp().getRequest<{ user?: { role?: string } }>();
		const user = req && req.user ? req.user : undefined;

		if (!user || typeof user.role !== "string" || user.role.length === 0) {
			throw new ForbiddenException("Access denied: no role assigned");
		}

		const hasRole = requiredRoles.includes(user.role);
		if (!hasRole) {
			throw new ForbiddenException("Access denied: insufficient role");
		}

		return true;
	}
}
