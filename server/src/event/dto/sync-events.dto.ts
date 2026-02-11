import { ApiProperty } from "@nestjs/swagger";
import { EventDto } from "./event.dto";

export class SyncEventsDto {
	@ApiProperty({
		description: "Horodatage de la dernière synchro",
		example: "2025-11-21T12:34:56.789Z",
	})
	lastSync: string;

	@ApiProperty({
		description: "Liste des événements modifiés depuis la dernière synchro",
		type: [EventDto],
	})
	events: EventDto[];

	removedEventIds: string[];
}
