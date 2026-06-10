import { IsUUID, IsIn } from 'class-validator';

export class CreateCommentReactionDto {
  @IsUUID()
  commentId: string;

  @IsIn(['LIKE', 'DISLIKE'])
  type: 'LIKE' | 'DISLIKE';
}
