import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty({ message: 'Nội dung bình luận không được để trống.' })
  content: string;

  @IsUUID()
  @IsNotEmpty({ message: 'Phải có filmId để xác định phim cần bình luận.' })
  filmId: string;

  @IsOptional()
  @IsUUID()
  partId?: string;

  @IsOptional()
  @IsUUID()
  episodeId?: string;

  @IsOptional()
  parentId?: string;
}
