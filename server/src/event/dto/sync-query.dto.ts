import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsISO8601, IsArray, IsString } from "class-validator";
import { Transform } from "class-transformer";

export class SyncQueryDto {
	@ApiPropertyOptional({
		description: "Date ISO 8601 de la dernière synchro côté client",
		example: "2025-11-17T14:34:55.909Z",
	})
	@IsOptional()
	@IsISO8601()
	since?: string;

	@ApiPropertyOptional({
		description: "Liste des IDs d'événements connus côté client (CSV)",
		example: "id1,id2,id3",
	})
	@IsOptional()
	@Transform(({ value }) => (typeof value === "string" ? value.split(",") : value))
	@IsArray()
	@IsString({ each: true })
	ids?: string[];
}
