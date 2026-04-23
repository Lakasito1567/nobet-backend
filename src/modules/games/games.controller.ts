import { Controller, Post, Body, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { BlackjackService, Card } from './blackjack/blackjack.service';
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
    // 1. Extraemos datos del usuario (del Token) y la apuesta
    const userId = req.user.userId;
    const username = req.user.username;
    const bet = Number(body.bet);

    // Validación básica de la apuesta
    if (!bet || bet <= 0) {
      throw new BadRequestException('La apuesta debe ser un número mayor a 0');
    }

    // 2. Intentar cobrar la apuesta de la Wallet
    try {
      await this.usersService.updateBalance(userId, -bet);
    } catch (error) {
      throw new BadRequestException('Saldo insuficiente para realizar esta apuesta');
    }

    // 3. Lógica del Jugador
    const playerHand: Card[] = [
      this.blackjackService.drawCard(),
      this.blackjackService.drawCard(),
    ];
    const playerScore = this.blackjackService.calculateScore(playerHand);

    // 4. Lógica del Crupier (IA)
    const dealerResult = this.blackjackService.playDealerHand();
    const dealerScore = dealerResult.score;

    // 5. Determinar Resultado y Premios
    let message = '';
    let winAmount = 0;

    if (playerScore > 21) {
      message = 'Te has pasado de 21. ¡Pierdes!';
    } else if (dealerScore > 21 || playerScore > dealerScore) {
      message = '¡Ganaste!';
      winAmount = bet * 2; 
      await this.usersService.updateBalance(userId, winAmount);
    } else if (playerScore === dealerScore) {
      message = 'Empate (Push). Se devuelve la apuesta.';
      await this.usersService.updateBalance(userId, bet);
    } else {
      message = 'El Crupier gana.';
    }

    // 6. Consultar balance final para la respuesta
    const userUpdated = await this.usersService.findOneByUsername(username);

    return {
      message,
      player: {
        username: username,
        hand: playerHand,
        score: playerScore,
      },
      dealer: {
        hand: dealerResult.hand,
        score: dealerScore,
      },
      bet: bet,
      newBalance: userUpdated?.balance,
    };
  }
}