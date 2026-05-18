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
    const userId = req.user.userId;
    return await this.usersService.updateBalance(userId, 1);
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
}