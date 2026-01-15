import { INestApplication } from "@nestjs/common";
import { getModelToken } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Event } from "../../src/event/event.schema";

export class EventFactory {
	private eventModel: Model<Event>;

	constructor(app: INestApplication) {
		this.eventModel = app.get(getModelToken(Event.name));
	}

	async create(overrides: Partial<any> = {}): Promise<Event> {
		const defaultEvent = {
			Nom: "Event Test Integration",
			id: `evt-${Date.now()}`,
			description: "Description de test",
			date: new Date(),
			location: "Paris",

			nbPlaceTotal: 100,
			nbPlaceOccupe: 0,
			personneInscrites: [],
			Status: "Ok",

			...overrides,
		};

		return this.eventModel.create(defaultEvent);
	}

	async cleanup() {
		await this.eventModel.deleteMany({});
	}
}
