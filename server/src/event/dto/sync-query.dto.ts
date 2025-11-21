import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsISO8601 } from "class-validator";

export class SyncQueryDto {
	@ApiPropertyOptional({
		description: "Date ISO 8601 de la dernière synchro côté client",
		example: "2025-11-17T14:34:55.909Z",
	})
	@IsOptional()
	@IsISO8601()
	since?: string;
}
