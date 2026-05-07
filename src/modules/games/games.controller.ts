import { Controller, Post, Body, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { BlackjackService } from './blackjack/blackjack.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from '../users/users.service';

@Controller('games')
export class GamesController {
  constructor(
    private readonly blackjackService: BlackjackService,
    private readonly usersService: UsersService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('blackjack/play')
  async play(@Request() req, @Body() body: { bet: number }) {
    const userId = req.user.userId;
    const bet = Number(body.bet);

    if (isNaN(bet) || bet <= 0) {
      throw new BadRequestException('La apuesta debe ser un número mayor a 0');
    }

    // 1. Cobrar la apuesta (bloqueante)
    await this.usersService.updateBalance(userId, -bet);
    
    // 2. Iniciar partida
    const game = await this.blackjackService.start(userId, bet);
    
    // 3. Gestionar fin inmediato (si sale Blackjack natural) o devolver estado
    return await this.handleGameEnd(userId, game);
  }

  @UseGuards(JwtAuthGuard)
  @Post('blackjack/hit')
  async hit(@Request() req) {
    const game = await this.blackjackService.hit(req.user.userId);
    return await this.handleGameEnd(req.user.userId, game);
  }

  @UseGuards(JwtAuthGuard)
  @Post('blackjack/stand')
  async stand(@Request() req) {
    const game = await this.blackjackService.stand(req.user.userId);
    return await this.handleGameEnd(req.user.userId, game);
  }

  /**
   * Procesa el pago y sincroniza el balance final
   */
  private async handleGameEnd(userId: number, game: any) {
    // IMPORTANTE: Tu BlackjackService DEBE devolver 'bet' en el objeto formatResponse
    const betAmount = Number(game.bet || 0);

    // Solo procesamos pagos si el estado es final
    if (game.status === 'won') {
      console.log(`Usuario ${userId} ganó. Pagando: ${betAmount * 2}`);
      await this.usersService.updateBalance(userId, betAmount * 2);
    } else if (game.status === 'draw') {
      console.log(`Usuario ${userId} empató. Devolviendo: ${betAmount}`);
      await this.usersService.updateBalance(userId, betAmount);
    }

    // SINCRONIZACIÓN CRÍTICA:
    // Buscamos el usuario RECIÉN actualizado de la base de datos después del pago
    const userUpdated = await this.usersService.findOneById(userId);
    
    // Forzamos el tipo Number para que el Frontend no reciba un string "2.00"
    const finalBalance = userUpdated ? Number(userUpdated.balance) : 0;

    return { 
      ...game, 
      newBalance: finalBalance 
    };
  }
}