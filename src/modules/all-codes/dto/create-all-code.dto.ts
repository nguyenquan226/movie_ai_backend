import { IsNotEmpty, IsString } from 'class-validator';

export class CreateAllCodeDto {
  @IsNotEmpty({ message: 'keyMap must not be empty' })
  @IsString({ message: 'keyMap must be STRING format' })
  keyMap: string;

  @IsString({ message: 'type must be STRING format' })
  @IsNotEmpty({ message: 'type must not be empty' })
  type: string;

  @IsString({ message: 'valueVi must be STRING format' })
  @IsNotEmpty({ message: 'valueVi must not be empty' })
  valueVi: string;
}
