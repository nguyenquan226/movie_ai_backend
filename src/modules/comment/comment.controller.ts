import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import type { IUser } from '../users/interface/user.interface';
import { Public, ResponseMessage, User } from 'src/decorators/customize';
import { Permission } from 'src/decorators/permission.decorator';
import { PaginationDto } from './dto/pagination.dto';

@Controller('comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get('all-comments')
  @Permission('Get all comments for admin', 'COMMENT')
  @ResponseMessage('Get all comments')
  getAllComments(@Query() query: PaginationDto, @User() user: IUser) {
    return this.commentService.getAllComments(query, user);
  }

  @Post('create-comment')
  @Permission('Create a new comment', 'COMMENT')
  @ResponseMessage('Create a new comment')
  createComment(@Body() createCommentDto: CreateCommentDto, @User() user: IUser) {
    return this.commentService.createComment(createCommentDto, user);
  }

  @Get('get-comments-by-film/:filmId')
  @Permission('Get comments by film (authenticated)', 'COMMENT')
  @ResponseMessage('Get comments by film ID')
  getCommentsByFilmAuth(
    @Param('filmId') filmId: string,
    @Query() query: PaginationDto,
    @User() user: IUser,
  ) {
    return this.commentService.findCommentsByFilm(query, filmId, user);
  }

  @Public()
  @Get('get-comments-by-film-guest/:filmId')
  @Permission('Get comments by film (guest)', 'COMMENT')
  @ResponseMessage('Get comments by film ID')
  getCommentsByFilmGuest(@Param('filmId') filmId: string, @Query() query: PaginationDto) {
    return this.commentService.findCommentsByFilm(query, filmId, null);
  }

  @Get('get-comment/:commentId')
  @Permission('Get comment by ID', 'COMMENT')
  @ResponseMessage('Get comment by ID')
  getComment(@Param('commentId') commentId: string) {
    return this.commentService.getComment(commentId);
  }

  @Patch('update-comment/:commentId')
  @Permission('Update a comment', 'COMMENT')
  @ResponseMessage('Update comment by ID')
  updateComment(
    @Param('commentId') commentId: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @User() user: IUser,
  ) {
    return this.commentService.updateComment(commentId, updateCommentDto, user);
  }

  @Delete('delete-comment/:commentId')
  @Permission('Delete comment', 'COMMENT')
  @ResponseMessage('Remove comment by ID')
  deleteComment(@Param('commentId') commentId: string, @User() user: IUser) {
    return this.commentService.deleteComment(commentId, user);
  }

  @Delete('hard-delete-comment/:commentId')
  @Permission('Hard delete comment', 'COMMENT')
  @ResponseMessage('Hard delete comment by ID')
  hardDeleteComment(@Param('commentId') commentId: string, @User() user: IUser) {
    return this.commentService.hardDeleteComment(commentId, user);
  }

  @Patch('toggle-hide/:commentId')
  @Permission('Toggle hide comment', 'COMMENT')
  toggleHideComment(@Param('commentId') id: string, @User() user: IUser) {
    return this.commentService.toggleHideComment(id, user);
  }

  @Public()
  @Get('count-by-film/:filmId')
  @Permission('Count comments by film', 'COMMENT')
  countComments(@Param('filmId') filmId: string) {
    return this.commentService.countCommentsByFilm(filmId);
  }

  @Get('statistics')
  @Permission('Get comment statistics', 'COMMENT')
  @ResponseMessage('Get comment statistics')
  getStatistics() {
    return this.commentService.getStatistics();
  }
}
