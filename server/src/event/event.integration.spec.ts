import { INestApplication } from "@nestjs/common";
import { Types } from "mongoose";
import { setupTestApp, teardownTestApp, TestContext, TEST_TIMEOUT } from "../../test/utils/test-setup";
import { UserFactory } from "../../test/utils/user-factory";
import { EventFactory } from "../../test/utils/event-factory";
import { getModelToken } from "@nestjs/mongoose";
import { Event } from "./event.schema";
import { Model } from "mongoose";

let eventModel: Model<Event>;

describe("Events Module (Integration)", () => {
	let context: TestContext;
	let app: INestApplication;
	let userFactory: UserFactory;
	let eventFactory: EventFactory;

	jest.setTimeout(TEST_TIMEOUT);

	beforeAll(async () => {
		context = await setupTestApp();
		app = context.app;
		userFactory = new UserFactory(app);
		eventFactory = new EventFactory(app);
		eventModel = context.moduleRef.get(getModelToken(Event.name));
	});

	afterAll(async () => {
		await teardownTestApp(context);
	});

	afterEach(async () => {
		await eventFactory.cleanup();
	});

	describe("POST /events/register", () => {
		it("should successfully register a user (201) and update event data in DB", async () => {
			const event = await eventFactory.create({
				nbPlaceTotal: 10,
				nbPlaceOccupe: 0,
				Status: "Ok",
				personneInscrites: [],
			});

			const initialEditDate = event.EditDate;

			const user = await userFactory.create({ role: "user" });

			await user.event.register(event._id.toString()).expect(201);

			// Vérification API
			const apiEvent = await user.event.getOne(event._id.toString());

			expect(apiEvent.body.AlreadyRegister).toBe(true);
			expect(apiEvent.body.nbPlaceOccupe).toBe(1);

			// Vérification DB réelle
			const dbEvent = await eventModel.findById(event._id).lean();

			expect(dbEvent.personneInscrites.map(String)).toContain(user.userData._id.toString());

			expect(new Date(dbEvent.EditDate).getTime()).toBeGreaterThan(new Date(initialEditDate).getTime());
		});

		it('should automatically change status to "Complet" when last place is taken', async () => {
			const event = await eventFactory.create({
				nbPlaceTotal: 1,
				nbPlaceOccupe: 0,
				Status: "Ok",
			});

			const user = await userFactory.create({ role: "user" });

			await user.event.register(event._id.toString()).expect(201);

			const apiEvent = await user.event.getOne(event._id.toString());
			expect(apiEvent.body.Status).toBe("Complet");

			const dbEvent = await eventModel.findById(event._id).lean();
			expect(dbEvent.nbPlaceOccupe).toBe(1);
			expect(dbEvent.personneInscrites.length).toBe(1);
		});

		it("should not mutate event when user already registered", async () => {
			const user = await userFactory.create({ role: "user" });

			const event = await eventFactory.create({
				nbPlaceTotal: 5,
				nbPlaceOccupe: 1,
				personneInscrites: [user.userData._id],
			});

			await user.event.register(event._id.toString()).expect(409);

			const dbEvent = await eventModel.findById(event._id).lean();

			expect(dbEvent.nbPlaceOccupe).toBe(1);
			expect(dbEvent.personneInscrites.length).toBe(1);
		});

		it("should not overbook event under concurrent registrations", async () => {
			const event = await eventFactory.create({
				nbPlaceTotal: 1,
				nbPlaceOccupe: 0,
				Status: "Ok",
			});

			const user1 = await userFactory.create({ role: "user" });
			const user2 = await userFactory.create({ role: "user" });

			await Promise.allSettled([
				user1.event.register(event._id.toString()),
				user2.event.register(event._id.toString()),
			]);

			const dbEvent = await eventModel.findById(event._id).lean();

			expect(dbEvent.nbPlaceOccupe).toBe(1);
			expect(dbEvent.personneInscrites.length).toBe(1);
		});

		it("should keep status Ok if places are still available", async () => {
			const event = await eventFactory.create({
				nbPlaceTotal: 5,
				nbPlaceOccupe: 2,
				Status: "Ok",
			});

			const user = await userFactory.create({ role: "user" });

			await user.event.register(event._id.toString()).expect(201);

			const updated = await user.event.getOne(event._id.toString());

			expect(updated.body.Status).toBe("Ok");
		});

		it('should automatically change status to "Complet" if last place is taken', async () => {
			const event = await eventFactory.create({
				nbPlaceTotal: 1,
				nbPlaceOccupe: 0,
				Status: "Ok",
			});

			const user = await userFactory.create({ role: "user" });

			await user.event.register(event._id.toString()).expect(201);

			const updated = await user.event.getOne(event._id.toString());

			expect(updated.body.Status).toBe("Complet");
			expect(updated.body.nbPlaceOccupe).toBe(1);
			expect(updated.body.nbPlaceOccupe).toBe(1);
		});

		it("should keep nbPlaceOccupe consistent with personneInscrites length", async () => {
			const event = await eventFactory.create({
				nbPlaceTotal: 5,
				nbPlaceOccupe: 0,
				personneInscrites: [],
			});

			const user = await userFactory.create({ role: "user" });

			await user.event.register(event._id.toString()).expect(201);

			const dbEvent = await eventModel.findById(event._id).lean();

			expect(dbEvent.nbPlaceOccupe).toBe(dbEvent.personneInscrites.length);
		});

		it("should return 404 if event not found", async () => {
			const user = await userFactory.create({ role: "user" });
			const fakeId = new Types.ObjectId().toString();

			await user.event.register(fakeId).expect(404);
		});

		it("should return 409 if user already registered and should not mutate event", async () => {
			const user = await userFactory.create({ role: "user" });

			const event = await eventFactory.create({
				nbPlaceTotal: 5,
				nbPlaceOccupe: 1,
				personneInscrites: [user.userData._id],
			});

			await user.event.register(event._id.toString()).expect(409);

			const unchanged = await user.event.getOne(event._id.toString());

			expect(unchanged.body.nbPlaceOccupe).toBe(1);
			const dbEvent = await eventModel.findById(event._id).lean();

			expect(dbEvent.nbPlaceOccupe).toBe(1);
			expect(dbEvent.personneInscrites.length).toBe(1);
		});

		it("should return 400 if event is full", async () => {
			const event = await eventFactory.create({
				nbPlaceTotal: 2,
				nbPlaceOccupe: 2,
				Status: "Ok",
			});

			const user = await userFactory.create({ role: "user" });

			const res = await user.event.register(event._id.toString()).expect(400);

			expect(res.body.message).toContain("Event is full");

			const unchanged = await user.event.getOne(event._id.toString());
			expect(unchanged.body.nbPlaceOccupe).toBe(2);
		});

		it("should return 400 if event status is not Ok", async () => {
			const event = await eventFactory.create({
				Status: "Cancelled",
				nbPlaceTotal: 10,
				nbPlaceOccupe: 0,
			});

			const user = await userFactory.create({ role: "user" });

			const res = await user.event.register(event._id.toString()).expect(400);

			expect(res.body.message).toMatch(/status is "Cancelled"/);

			const unchanged = await user.event.getOne(event._id.toString());
			expect(unchanged.body.nbPlaceOccupe).toBe(0);
		});

		it("should update EditDate when status switches to Complet", async () => {
			const event = await eventFactory.create({
				nbPlaceTotal: 1,
				nbPlaceOccupe: 0,
				Status: "Ok",
			});

			const initialEditDate = event.EditDate;

			const user = await userFactory.create({ role: "user" });

			await user.event.register(event._id.toString());

			const updated = await user.event.getOne(event._id.toString());

			expect(new Date(updated.body.EditDate).getTime()).toBeGreaterThan(new Date(initialEditDate).getTime());
		});

		it("should not overbook event under concurrent registrations", async () => {
			const event = await eventFactory.create({
				nbPlaceTotal: 1,
				nbPlaceOccupe: 0,
				Status: "Ok",
			});

			const user1 = await userFactory.create({ role: "user" });
			const user2 = await userFactory.create({ role: "user" });

			await Promise.allSettled([
				user1.event.register(event._id.toString()),
				user2.event.register(event._id.toString()),
			]);

			const updated = await user1.event.getOne(event._id.toString());

			expect(updated.body.nbPlaceOccupe).toBe(1);
			expect(updated.body.nbPlaceOccupe).toBe(1);
		});
	});

	describe("GET /events", () => {
		it("should return a list of events", async () => {
			await eventFactory.create({ Nom: "Event A" });
			await eventFactory.create({ Nom: "Event B" });

			// AJOUT DE AWAIT ICI
			const user = await userFactory.create();
			const response = await user.event.getAll().expect(200);

			expect(response.body.data).toHaveLength(2);
			expect(response.body.meta.total).toBe(2);
		});

		it("should correctly mark AlreadyRegister if user is subscribed", async () => {
			// AJOUT DE AWAIT ICI
			const user = await userFactory.create();

			await eventFactory.create({
				Nom: "My Event",
				personneInscrites: [user.userData._id],
			});

			const response = await user.event.getAll().expect(200);
			expect(response.body.data[0].AlreadyRegister).toBe(true);
		});
	});

	describe("GET /events/:id", () => {
		it("should return event details", async () => {
			const event = await eventFactory.create({ Nom: "Detail Event" });

			// AJOUT DE AWAIT ICI
			const user = await userFactory.create();

			const response = await user.event.getOne(event._id.toString()).expect(200);
			expect(response.body.Nom).toBe("Detail Event");
		});

		it("should return 404 if event does not exist", async () => {
			// AJOUT DE AWAIT ICI
			const user = await userFactory.create();
			const fakeId = new Types.ObjectId().toString();

			await user.event.getOne(fakeId).expect(404);
		});

		it("should return 400 if id is invalid (not objectId)", async () => {
			// AJOUT DE AWAIT ICI
			const user = await userFactory.create();
			await user.event.getOne("invalid-id-string").expect(400);
		});
	});

	describe("POST /events/unregister", () => {
		it("should successfully unregister a user", async () => {
			// Setup : Event avec 1 inscrit (l'utilisateur courant)
			const user = await userFactory.create({ role: "user" });
			const event = await eventFactory.create({
				nbPlaceTotal: 10,
				nbPlaceOccupe: 1,
				personneInscrites: [user.userData._id],
				Status: "Ok",
			});

			// Action : Désinscription
			// Note: On assume que POST retourne 201 par défaut dans NestJS
			await user.event.unregister(event._id.toString()).expect(201);

			// Vérification
			const check = await user.event.getOne(event._id.toString());
			expect(check.body.AlreadyRegister).toBe(false);
			expect(check.body.nbPlaceOccupe).toBe(0);
		});

		it('should change status from "Complet" to "Ok" and decrease capacity', async () => {
			// Setup : Event COMPLET avec l'utilisateur inscrit
			const user = await userFactory.create({ role: "user" });
			const event = await eventFactory.create({
				nbPlaceTotal: 10,
				nbPlaceOccupe: 10,
				personneInscrites: [user.userData._id], // (simulation, techniquement, il y en aurait 9 autres)
				Status: "Complet",
			});

			// Action
			await user.event.unregister(event._id.toString()).expect(201);

			// Vérification
			const check = await user.event.getOne(event._id.toString());
			expect(check.body.Status).toBe("Ok");
			expect(check.body.nbPlaceOccupe).toBe(9);
		});

		it('should return 409 (Conflict) with "event_cancel" if event is Cancelled', async () => {
			const user = await userFactory.create({ role: "user" });
			const event = await eventFactory.create({
				Status: "Cancelled",
				personneInscrites: [user.userData._id],
				nbPlaceOccupe: 5,
			});

			const res = await user.event.unregister(event._id.toString()).expect(409);
			expect(res.body.message).toBe("event_cancel");
		});

		it("should return 400 if user is not registered", async () => {
			const user = await userFactory.create({ role: "user" });
			const event = await eventFactory.create({
				personneInscrites: [], // Personne inscrite
			});

			const res = await user.event.unregister(event._id.toString()).expect(400);
			expect(res.body.message).toMatch(/not registered/i);
		});

		it("should return 404 if event not found", async () => {
			const user = await userFactory.create({ role: "user" });
			const fakeId = new Types.ObjectId().toString();
			await user.event.unregister(fakeId).expect(404);
		});
	});

	describe("GET /events/sync", () => {
		it('should return events modified after "since" date where user is registered', async () => {
			// AJOUT DE AWAIT ICI
			const user = await userFactory.create();

			await eventFactory.create({
				Nom: "Updated Event",
				EditDate: new Date(),
				personneInscrites: [user.userData._id],
			});

			await eventFactory.create({
				Nom: "Old Event",
				EditDate: new Date("2023-01-01"),
				personneInscrites: [user.userData._id],
			});

			await eventFactory.create({ Nom: "Not My Event", EditDate: new Date() });

			const response = await user.event.sync("2024-01-01").expect(200);

			expect(response.body.events).toHaveLength(1);
			expect(response.body.events[0].Nom).toBe("Updated Event");
		});

		it("should return 400 for invalid date format", async () => {
			// AJOUT DE AWAIT ICI
			const user = await userFactory.create();
			await user.event.sync("invalid-date").expect(400);
		});
	});

	describe("PATCH /events/:id", () => {
		it("should update capacity successfully for admin", async () => {
			const event = await eventFactory.create({ nbPlaceTotal: 100 });
			// AJOUT DE AWAIT ICI
			const admin = await userFactory.create({ role: "admin" });

			await admin.event.updateCapacity(event._id.toString(), 200).expect(200);

			const updated = await admin.event.getOne(event._id.toString());
			expect(updated.body.nbPlaceTotal).toBe(200);
		});

		it("should return 403 Forbidden for normal user", async () => {
			const event = await eventFactory.create();
			// AJOUT DE AWAIT ICI
			const user = await userFactory.create({ role: "user" });

			await user.event.updateCapacity(event._id.toString(), 200).expect(403);
		});

		it("should return 400 if new capacity is lower than occupied", async () => {
			const event = await eventFactory.create({ nbPlaceTotal: 10, nbPlaceOccupe: 5 });
			// AJOUT DE AWAIT ICI
			const admin = await userFactory.create({ role: "admin" });

			await admin.event.updateCapacity(event._id.toString(), 4).expect(400);
		});

		it('should reset status to "Ok" if capacity increases on a "Complet" event', async () => {
			const event = await eventFactory.create({
				nbPlaceTotal: 10,
				nbPlaceOccupe: 10,
				Status: "Complet",
			});
			// AJOUT DE AWAIT ICI
			const admin = await userFactory.create({ role: "admin" });

			await admin.event.updateCapacity(event._id.toString(), 20).expect(200);

			const updated = await admin.event.getOne(event._id.toString());
			expect(updated.body.Status).toBe("Ok");
		});
	});

	describe("DELETE /events/:id", () => {
		it("should hard delete event if no participants", async () => {
			const event = await eventFactory.create({ nbPlaceOccupe: 0, personneInscrites: [] });
			// AJOUT DE AWAIT ICI
			const admin = await userFactory.create({ role: "admin" });

			const res = await admin.event.delete(event._id.toString()).expect(200);
			expect(res.body.action).toBe("deleted");

			await admin.event.getOne(event._id.toString()).expect(404);
		});

		it("should soft delete (cancel) event if there are participants", async () => {
			const event = await eventFactory.create({
				nbPlaceOccupe: 1,
				personneInscrites: [new Types.ObjectId()],
				Status: "Ok",
			});
			// AJOUT DE AWAIT ICI
			const admin = await userFactory.create({ role: "admin" });

			const res = await admin.event.delete(event._id.toString()).expect(200);
			expect(res.body.action).toBe("canceled");

			const check = await admin.event.getOne(event._id.toString()).expect(200);
			expect(check.body.Status).toBe("Cancelled");
		});

		it("should return 400 if trying to cancel an event that is not Ok", async () => {
			const event = await eventFactory.create({ nbPlaceOccupe: 1, Status: "Cancelled" });
			// AJOUT DE AWAIT ICI
			const admin = await userFactory.create({ role: "admin" });

			await admin.event.delete(event._id.toString()).expect(400);
		});

		it("should return 403 for normal user", async () => {
			const event = await eventFactory.create();
			// AJOUT DE AWAIT ICI
			const user = await userFactory.create({ role: "user" });

			await user.event.delete(event._id.toString()).expect(403);
		});
	});
});
