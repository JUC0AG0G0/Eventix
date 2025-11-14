import { IsString } from "class-validator";

export class RegisterEventDto {
	@IsString()
	id: string;
}
