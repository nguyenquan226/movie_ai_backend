import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { CommentReactionService } from './comment-reaction.service';
import { CreateCommentReactionDto } from './dto/create-comment-reaction.dto';
import { User } from 'src/decorators/customize';
import type { IUser } from '../users/interface/user.interface';
import { Permission } from 'src/decorators/permission.decorator';

@Controller('comment-reactions')
export class CommentReactionController {
  constructor(private readonly reactionService: CommentReactionService) {}

  @Post('create-reaction')
  @Permission('Create reaction to comment', 'COMMENT-REACTIONS')
  async react(@Body() dto: CreateCommentReactionDto, @User() user: IUser) {
    return this.reactionService.reactToComment(dto, user);
  }
}
