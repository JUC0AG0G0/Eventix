import { IsEmail, IsString, Length } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class LoginDto {
	@ApiProperty({ example: "jane.doe@example.com" })
	@IsEmail()
	email: string;

	@ApiProperty({ example: "ChangeMe123" })
	@IsString()
	@Length(8, 128)
	password: string;
}
