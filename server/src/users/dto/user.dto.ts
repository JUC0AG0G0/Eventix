import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class UserDto {
	@ApiProperty({ example: "Email de l'utilisateur" })
	@Expose()
	email: string;

	@ApiProperty({ example: "¨Prénom de l'utilisateur" })
	@Expose()
	firstName: string;

	@ApiProperty({ example: "Nom de l'utilisateur" })
	@Expose()
	lastName: string;

	@ApiProperty({ example: "role" })
	@Expose()
	role: string;
}

export class UserFromEntityDto {
	@ApiProperty({ type: UserDto })
	user: UserDto;
}
