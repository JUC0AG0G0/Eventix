import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
	@Prop({ required: true, unique: true, index: true })
	email: string;

	@Prop({ required: true })
	firstName: string;

	@Prop({ required: true })
	lastName: string;

	// on stocke le hash du mot de passe (pas le mot de passe en clair)
	@Prop({ required: true })
	passwordHash: string;

	@Prop({ default: "user" })
	role: string;
}

export const UserSchema = SchemaFactory.createForClass(User);