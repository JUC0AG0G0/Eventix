import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { HydratedDocument } from "mongoose";

//export type EventDocument = Event & Document;
export type EventDocument = HydratedDocument<Event>;

@Schema({ collection: "event", timestamps: false })
export class Event {
	@Prop({ required: true, unique: true })
	id: string;

	@Prop({ required: true })
	Nom: string;

	@Prop()
	Description?: string;

	@Prop()
	Image?: string;

	@Prop({ type: Number, default: 0 })
	nbPlaceTotal: number;

	@Prop({ type: Number, default: 0 })
	nbPlaceOccupe: number;

	@Prop({ type: [String], default: [] })
	personneInscrites: string[];

	@Prop()
	Status?: string;

	@Prop({ type: Date, default: Date.now })
	EditDate: Date;
}

export const EventSchema = SchemaFactory.createForClass(Event);
