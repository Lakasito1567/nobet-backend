import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { BlackjackService } from './blackjack/blackjack.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('games')
export class GamesController {
  constructor(private readonly blackjackService: BlackjackService) {}

  @UseGuards(JwtAuthGuard) // Esto protege la ruta con tu token
  @Post('blackjack/play')
  play(@Request() req, @Body() body: { bet: number }) {
    const user = req.user; // Aquí tienes al usuario gracias al Token
    const bet = body.bet;

    const card1 = this.blackjackService.drawCard();
    const card2 = this.blackjackService.drawCard();
    const score = this.blackjackService.calculateScore([card1, card2]);

    return {
      player: user.username,
      bet: bet,
      hand: [card1, card2],
      total: score,
      status: score === 21 ? 'BLACKJACK!' : 'In Game'
    };
  }
}