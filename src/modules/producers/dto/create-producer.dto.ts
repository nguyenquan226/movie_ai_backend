import { IsString } from "class-validator"

export class CreateProducerDto {
  @IsString()
  producerName: string
}
    