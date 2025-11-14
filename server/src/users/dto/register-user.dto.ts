import { IsEmail, IsString, Length } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class RegisterUserDto {
	@ApiProperty({ example: "jane.doe@example.com" })
	@IsEmail()
	email: string;

	@ApiProperty({ example: "Jane" })
	@IsString()
	@Length(1, 50)
	firstName: string;

	@ApiProperty({ example: "Doe" })
	@IsString()
	@Length(1, 50)
	lastName: string;

	@ApiProperty({ example: "ChangeMe123" })
	@IsString()
	@Length(8, 128)
	password: string;
}
