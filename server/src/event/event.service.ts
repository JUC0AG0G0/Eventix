import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Event, EventDocument } from "./event.schema";

@Injectable()
export class EventService {
	constructor(@InjectModel(Event.name) private readonly eventModel: Model<EventDocument>) {}

	/**
	 * Récupère les events paginés (documents bruts).
	 * page starts at 1
	 * limit default 10
	 */
	async findPaginatedRaw(page = 1, limit = 10) {
		const skip = (Math.max(page, 1) - 1) * limit;

		const [docs, total] = await Promise.all([
			this.eventModel.find().sort({ EditDate: -1 }).skip(skip).limit(limit).lean().exec(),
			this.eventModel.countDocuments().exec(),
		]);

		const pageCount = Math.ceil(total / limit);

		return {
			docs,
			meta: {
				total,
				page: Math.max(page, 1),
				limit,
				pageCount,
			},
		};
	}
}
