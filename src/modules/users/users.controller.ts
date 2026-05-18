import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('leaderboard')
  async getLeaderboard() {
    return await this.usersService.getLeaderboard();
  }

  @UseGuards(JwtAuthGuard)
  @Post('claim-charity')
  async claimCharity(@Request() req) {
    return await this.usersService.claimCharity(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('roulette-settle')
  async rouletteSettle(@Request() req, @Body() body: { bets: any[], winner: number }) {
    const userId = req.user.userId;
    return await this.usersService.rouletteSettle(userId, body.bets, body.winner);
  }

  @Post('register')
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('roulette-deduct')
    async rouletteDeduct(
    @Request() req,
    @Body() body: { amount: number }
    ) {
    const userId = req.user.userId;
    return await this.usersService.updateBalance(
      userId,
      -Number(body.amount)
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('friend-request')
  async sendFriendRequest(
    @Request() req,
    @Body() body: { username: string },
  ) {
    return await this.usersService.sendFriendRequest(
      req.user.userId,
      body.username,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('friend-requests')
  async getPendingRequests(@Request() req) {
    return await this.usersService.getPendingRequests(
      req.user.userId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('friend-request/accept')
  async acceptRequest(
    @Request() req,
    @Body() body: { requestId: number },
  ) {
    return await this.usersService.acceptFriendRequest(
      req.user.userId,
      body.requestId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('friend-request/reject')
  async rejectRequest(
    @Request() req,
    @Body() body: { requestId: number },
  ) {
    return await this.usersService.rejectFriendRequest(
      req.user.userId,
      body.requestId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('remove-friend')
  async removeFriend(
    @Request() req,
    @Body() body: { friendId: number },
  ) {
    return await this.usersService.removeFriend(
      req.user.userId,
      body.friendId,
    );
  }

    @UseGuards(JwtAuthGuard)
    @Get('leaderboard/friends')
    async getFriendsLeaderboard(@Request() req) {
      return await this.usersService.getFriendsLeaderboard(
        req.user.userId
      );
    }
  }