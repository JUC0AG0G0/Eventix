import { IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class RegisterEventDto {
	@ApiProperty({
		description: "Identifiant de l'événement auquel s'inscrire",
		example: "691dd58f7124334ce49dc2a2",
	})
	@IsString()
	id: string;
}
