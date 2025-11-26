import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Event, EventDocument } from "./event.schema";
import { UpdateCapacityDto } from "./dto/update-capacity.dto";
import { SyncEventsDto } from "./dto/sync-events.dto";
import { plainToInstance } from "class-transformer";
import { EventDto } from "./dto/event.dto";

@Injectable()
export class EventService {
	constructor(@InjectModel(Event.name) private readonly eventModel: Model<EventDocument>) {}

	async findPaginatedRaw(page = 1, limit = 10, userId?: string) {
		const pageNumber = Math.max(page, 1);
		const skip = (pageNumber - 1) * limit;

		let userObjectId: Types.ObjectId | null = null;
		if (userId) {
			if (!Types.ObjectId.isValid(userId)) {
				throw new BadRequestException("Invalid user id");
			}
			userObjectId = new Types.ObjectId(userId);
		}

		const [docs, total] = await Promise.all([
			this.eventModel.find().sort({ EditDate: -1 }).skip(skip).limit(limit).lean().exec(),

			this.eventModel.countDocuments().exec(),
		]);

		const docsWithStringId = docs.map((event) => {
			const inscritIds = (event.personneInscrites || []).map((id: any) => String(id));
			const alreadyRegister = userObjectId ? inscritIds.includes(String(userObjectId)) : false;

			return {
				...event,
				_id: event._id instanceof Types.ObjectId ? event._id.toHexString() : event._id,
				AlreadyRegister: alreadyRegister,
			};
		});

		const pageCount = Math.ceil(total / limit);

		return {
			docs: docsWithStringId,
			meta: {
				total,
				page: pageNumber,
				limit,
				pageCount,
			},
		};
	}

	async findById(eventId: string, userId: string) {
		if (!Types.ObjectId.isValid(eventId)) {
			throw new BadRequestException("Invalid event id");
		}
		if (!Types.ObjectId.isValid(userId)) {
			throw new BadRequestException("Invalid user id");
		}

		const eventObjectId = new Types.ObjectId(eventId);
		const userObjectId = new Types.ObjectId(userId);

		const event = await this.eventModel.findById(eventObjectId).lean().exec();
		if (!event) {
			throw new NotFoundException("Event not found");
		}

		const inscritIds = (event.personneInscrites || []).map((id: any) => String(id));
		const alreadyRegister = inscritIds.includes(String(userObjectId));

		const eventWithStringId = {
			...event,
			_id: event._id instanceof Types.ObjectId ? event._id.toHexString() : event._id,
			AlreadyRegister: alreadyRegister,
		};

		return eventWithStringId;
	}

	async registerUser(eventId: string, userId: string) {
		if (!Types.ObjectId.isValid(eventId)) {
			throw new NotFoundException("Event not found");
		}
		if (!Types.ObjectId.isValid(userId)) {
			throw new BadRequestException("Invalid user id");
		}

		const eventObjectId = new Types.ObjectId(eventId);
		const userObjectId = new Types.ObjectId(userId);

		const filter = {
			_id: eventObjectId,
			personneInscrites: { $ne: userObjectId },
			$expr: { $lt: ["$nbPlaceOccupe", "$nbPlaceTotal"] },
			Status: "Ok",
		};

		const update: any = {
			$addToSet: { personneInscrites: userObjectId },
			$inc: { nbPlaceOccupe: 1 },
		};

		const options = { new: true } as const;

		let updated = await this.eventModel.findOneAndUpdate(filter, update, options).lean().exec();

		if (!updated) {
			const existing = await this.eventModel.findOne({ _id: eventObjectId }).lean().exec();
			if (!existing) {
				throw new NotFoundException("Event not found");
			}

			const inscritIds = (existing.personneInscrites || []).map((id: any) => String(id));
			if (inscritIds.includes(String(userObjectId))) {
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
				.findOneAndUpdate({ _id: eventObjectId }, { Status: "Complet" }, { new: true } as const)
				.lean()
				.exec();
		}

		return updated;
	}

	async deleteEvent(eventId: string) {
		if (!Types.ObjectId.isValid(eventId)) {
			throw new BadRequestException("Invalid event id");
		}

		const eventObjectId = new Types.ObjectId(eventId);

		const existing = await this.eventModel.findById(eventObjectId).lean().exec();
		if (!existing) {
			throw new NotFoundException("Event not found");
		}

		const occupied = existing.nbPlaceOccupe ?? 0;

		if (occupied > 0) {
			if (existing.Status !== "Ok") {
				throw new BadRequestException(`Cannot cancel event with status "${existing.Status}"`);
			}

			const updated = await this.eventModel
				.findOneAndUpdate(
					{ _id: eventObjectId, Status: "Ok" },
					{ $set: { Status: "Canceled", EditDate: new Date() } },
					{ new: true } as const,
				)
				.lean()
				.exec();

			if (!updated) {
				throw new BadRequestException("Unable to cancel event");
			}

			return updated;
		}

		const deleted = await this.eventModel.findByIdAndDelete(eventObjectId).lean().exec();
		if (!deleted) {
			throw new NotFoundException("Event not found");
		}

		return deleted;
	}

	async patchEvent(id: string, body: UpdateCapacityDto) {
		const event = await this.eventModel.findById(id);

		if (!event) {
			throw new NotFoundException("Événement introuvable.");
		}

		const newCapacity = body.nbplace;

		if (newCapacity < event.nbPlaceOccupe) {
			throw new BadRequestException(
				"La nouvelle capacité ne peut pas être inférieure au nombre de places déjà occupées.",
			);
		}

		event.nbPlaceTotal = newCapacity;
		event.EditDate = new Date();

		await event.save();

		return;
	}

	async syncUserEvents(userId: string, sinceIso?: string): Promise<SyncEventsDto> {
		const since = sinceIso ? new Date(sinceIso) : new Date(0);

		if (sinceIso && Number.isNaN(since.getTime())) {
			throw new BadRequestException({ message: "Paramètre 'since' invalide (format ISO attendu)." });
		}

		const eventsRaw = await this.findUserEventsModifiedAfter(userId, since);

		const events = plainToInstance(EventDto, eventsRaw, {
			excludeExtraneousValues: true,
		});

		return {
			lastSync: new Date().toISOString(),
			events,
		};
	}

	async findUserEventsModifiedAfter(userId: string, since: Date) {
		if (!Types.ObjectId.isValid(userId)) {
			throw new BadRequestException("Invalid user id");
		}

		const userObjectId = new Types.ObjectId(userId);

		return this.eventModel
			.find({
				personneInscrites: { $in: [userObjectId] },
				EditDate: { $gt: since },
			})
			.sort({ EditDate: -1 })
			.lean()
			.exec();
	}
}
