import { IsInt, Min } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateCapacityDto {
	@ApiProperty({
		description: "Nouvelle capacité maximale (nombre entier >= 1)",
		example: 50,
		minimum: 1,
	})
	@IsInt({ message: "nbplace doit être un entier." })
	@Min(1, { message: "nbplace doit être au moins 1." })
	nbplace: number;
}
