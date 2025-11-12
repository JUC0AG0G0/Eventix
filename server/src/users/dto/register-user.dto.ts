import { IsEmail, IsString, Length } from "class-validator";

export class RegisterUserDto {
	@IsEmail()
	email: string;

	@IsString()
	@Length(1, 50)
	firstName: string;

	@IsString()
	@Length(1, 50)
	lastName: string;

	@IsString()
	@Length(8, 128)
	password: string;
}
