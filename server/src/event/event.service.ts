import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Event, EventDocument } from "./event.schema";

@Injectable()
export class EventService {
	constructor(@InjectModel(Event.name) private readonly eventModel: Model<EventDocument>) {}

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

	async registerUser(eventId: string, userId: string) {
		const filter = {
			id: eventId,
			personneInscrites: { $ne: userId },
			$expr: { $lt: ["$nbPlaceOccupe", "$nbPlaceTotal"] },
			Status: "Ok",
		};

		const update: any = {
			$addToSet: { personneInscrites: userId },
			$inc: { nbPlaceOccupe: 1 },
		};

		const options = { new: true } as const;

		let updated = await this.eventModel.findOneAndUpdate(filter, update, options).lean().exec();

		if (!updated) {
			const existing = await this.eventModel.findOne({ id: eventId }).lean().exec();
			if (!existing) {
				throw new NotFoundException("Event not found");
			}

			if ((existing.personneInscrites || []).includes(userId)) {
				throw new ConflictException("User already registered to this event");
			}

			if (existing.Status !== "Ok") {
				throw new BadRequestException(`Cannot register, event status is "${existing.Status}"`);
			}

			if ((existing.nbPlaceOccupe ?? 0) >= (existing.nbPlaceTotal ?? 0)) {
				throw new BadRequestException("Event is full");
			}

			throw new BadRequestException("Unable to register to event");
		}

		if (updated.nbPlaceOccupe >= updated.nbPlaceTotal && updated.Status === "Ok") {
			updated = await this.eventModel
				.findOneAndUpdate({ id: eventId }, { Status: "Complet" }, { new: true } as const)
				.lean()
				.exec();
		}

		return updated;
	}
}
