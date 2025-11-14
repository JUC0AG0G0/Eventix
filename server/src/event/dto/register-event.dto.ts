import { IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class RegisterEventDto {
	@ApiProperty({
		description: "Identifiant de l'événement auquel s'inscrire",
		example: "ab2aa2f3-19ad-4f27-a829-875dc95e603f",
	})
	@IsString()
	id: string;
}
