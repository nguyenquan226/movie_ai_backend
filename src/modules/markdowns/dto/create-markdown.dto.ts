import { IsNotEmpty, IsString } from 'class-validator';

export class CreateMarkdownDto {
  @IsNotEmpty({ message: 'markdownContent must be not Empty' })
  @IsString({ message: 'markdownContent must be string format' })
  markdownContent: string;

  @IsNotEmpty({ message: 'htmlContent must be not Empty' })
  @IsString({ message: 'htmlContent must be string format' })
  htmlContent: string;

  @IsNotEmpty({ message: 'shortDescription must be not Empty' })
  @IsString({ message: 'shortDescription must be string format' })
  shortDescription: string;
}
