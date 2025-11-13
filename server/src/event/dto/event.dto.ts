import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class EventDto {
	@ApiProperty({ example: "d803a0d5-a956-4bbf-823e-f93433b3ccea" })
	@Expose()
	id: string;

	@ApiProperty({ example: "Randonnée en montagne" })
	@Expose()
	Nom: string;

	@ApiProperty({ example: "Découvrez les magnifiques paysages..." })
	@Expose()
	Description?: string;

	@ApiProperty({ example: "https://exemple.com/image.jpg" })
	@Expose()
	Image?: string;

	@ApiProperty({ example: 25 })
	@Expose()
	nbPlaceTotal: number;

	@ApiProperty({ example: 8 })
	@Expose()
	nbPlaceOccupe: number;

	@ApiProperty({ example: "Ok" })
	@Expose()
	Status?: string;

	@ApiProperty({ example: "2025-09-14T08:43:28.719Z", type: String })
	@Expose()
	EditDate: Date;
}

export class PaginatedEventsDto {
	@ApiProperty({ type: [EventDto] })
	data: EventDto[];

	@ApiProperty({
		type: Object,
		example: {
			total: 6,
			page: 1,
			limit: 10,
			pageCount: 1,
		},
	})
	meta: {
		total: number;
		page: number;
		limit: number;
		pageCount: number;
	};
}
