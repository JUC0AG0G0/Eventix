import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, Length } from "class-validator";

export class LoginDto {
	@ApiProperty({ example: "test@test.com" })
	@IsNotEmpty()
	@IsEmail()
	email: string;

	@ApiProperty({ example: "password123" })
	@IsNotEmpty()
	@IsString()
	@Length(8, 128)
	password: string;
}
