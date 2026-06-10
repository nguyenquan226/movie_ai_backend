import { PartialType } from '@nestjs/mapped-types';
import { CreateCommentReactionDto } from './create-comment-reaction.dto';

export class UpdateCommentReactionDto extends PartialType(CreateCommentReactionDto) {}
