import { Controller, Post, Body, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { BlackjackService } from './blackjack/blackjack.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from '../users/users.service';
import { DiceService } from './dice/dice.service'; // 1. Importamos el nuevo servicio de dados

// Definimos la interfaz aquí mismo para evitar el error de emitDecoratorMetadata / isolatedModules
export interface DiceRollDto {
  bet: number;
  target: number;
  condition: 'over' | 'under';
}

@Controller('games')
export class GamesController {
  constructor(
    private readonly blackjackService: BlackjackService,
    private readonly usersService: UsersService,
    private readonly diceService: DiceService, // 2. Inyectamos el servicio de dados
  ) {}

  // ─── ENDPOINTS DE BLACKJACK (SE MANTIENEN INTACTOS) ───────────────────

  @UseGuards(JwtAuthGuard)
  @Post('blackjack/play')
  async play(@Request() req, @Body() body: { bet: number }) {
    const userId = req.user.userId;
    const bet = Number(body.bet);

    if (isNaN(bet) || bet <= 0) {
      throw new BadRequestException('La apuesta debe ser un número mayor a 0');
    }

    await this.usersService.updateBalance(userId, -bet);
    const game = await this.blackjackService.start(userId, bet);
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

  private async handleGameEnd(userId: number, game: any) {
    const betAmount = Number(game.bet || 0);

    if (game.status === 'won') {
      console.log(`Usuario ${userId} ganó. Pagando: ${betAmount * 2}`);
      await this.usersService.updateBalance(userId, betAmount * 2);
    } else if (game.status === 'draw') {
      console.log(`Usuario ${userId} empató. Devolviendo: ${betAmount}`);
      await this.usersService.updateBalance(userId, betAmount);
    }

    const userUpdated = await this.usersService.findOneById(userId);
    const finalBalance = userUpdated ? Number(userUpdated.balance) : 0;

    return { 
      ...game, 
      newBalance: finalBalance 
    };
  }

  // ─── ENDPOINT NUEVO: DICE GAME (CONECTADO A TU SINK DE BALANCE) ───────

  @UseGuards(JwtAuthGuard)
  @Post('dice/roll')
  async rollDice(@Request() req, @Body() body: DiceRollDto) {
    const userId = req.user.userId;
    const betAmount = Number(body.bet);
    const target = Number(body.target);
    const condition = body.condition;

    // Validaciones básicas de entrada
    if (isNaN(betAmount) || betAmount <= 0) {
      throw new BadRequestException('La apuesta debe ser un número mayor a 0');
    }
    if (isNaN(target) || target < 2 || target > 98) {
      throw new BadRequestException('El objetivo de dados debe estar entre 2 y 98');
    }
    if (condition !== 'over' && condition !== 'under') {
      throw new BadRequestException('La condición debe ser "over" o "under"');
    }

    // 1. Validar que el usuario tenga saldo suficiente antes de jugar
    const currentUser = await this.usersService.findOneById(userId);
    if (!currentUser || Number(currentUser.balance) < betAmount) {
      throw new BadRequestException('Fondos insuficientes para realizar la apuesta');
    }

    // 2. Cobrar la apuesta (bloqueante en base de datos)
    await this.usersService.updateBalance(userId, -betAmount);

    // 3. Procesar la matemática y el RND seguro del dado
    const diceResult = await this.diceService.roll(userId, { bet: betAmount, target, condition });

    // 4. Si el resultado es ganador, pagar el payout correspondiente
    if (diceResult.isWin && diceResult.payout > 0) {
      console.log(`Usuario ${userId} ganó en dados. Pagando premio: ${diceResult.payout}`);
      await this.usersService.updateBalance(userId, diceResult.payout);
    }

    // 5. Sincronizar el balance final real de la base de datos para el Frontend
    const userUpdated = await this.usersService.findOneById(userId);
    const finalBalance = userUpdated ? Number(userUpdated.balance) : 0;

    // Retornamos la respuesta enriquecida al cliente en React
    return {
      ...diceResult,
      newBalance: finalBalance
    };
  }
}