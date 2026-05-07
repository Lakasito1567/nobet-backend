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
    // Extraemos el ID directamente del token para máxima seguridad
    const userId = req.user.userId;
    
    // El servicio ya se encarga de sumar y guardar
    return await this.usersService.updateBalance(userId, 1);
  }

  @Post('register')
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }
}