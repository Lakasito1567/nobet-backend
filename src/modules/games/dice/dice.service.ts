import { Injectable, BadRequestException } from '@nestjs/common';

export interface DiceRollDto {
  bet: number;
  target: number;
  condition: 'over' | 'under';
}

@Injectable()
export class DiceService {
  // Inyecta aquí tu UsersService o el repositorio encargado del balance de la BD
  // constructor(private usersService: UsersService) {}

  async roll(userId: number, dto: DiceRollDto) {
    const betAmount = Number(dto.bet);
    const target = Number(dto.target);
    const condition = dto.condition;

    if (betAmount <= 0) {
      throw new BadRequestException('La cantidad apostada debe ser mayor a cero.');
    }
    if (target < 2 || target > 98) {
      throw new BadRequestException('El objetivo debe estar entre 2 y 98.');
    }

    // ─── 1. VALIDACIÓN DE SALDO ───
    // const user = await this.usersService.findById(userId);
    // if (user.balance < betAmount) throw new BadRequestException('Fondos insuficientes.');

    // ─── 2. RESTA INMEDIATA DE LA APUESTA ───
    // await this.usersService.updateBalance(userId, user.balance - betAmount);

    // ─── 3. CÁLCULO DE PROBABILIDADES Y MULTIPLICADOR (Reglas de tu Frontend) ───
    const houseEdge = 1.0; // 1% ventaja de la casa
    const winChance = condition === 'over' ? 100 - target : target;
    const multiplier = winChance > 0 ? (100 - houseEdge) / winChance : 0;

    // ─── 4. EJECUCIÓN SEGURA DEL RND EN EL SERVIDOR ───
    const roll = Number((Math.random() * 100).toFixed(2));

    // Verificar condición de victoria
    const isWin = condition === 'over' ? roll > target : roll < target;
    
    // Calcular ganancia neta o pérdida
    let payout = 0;
    let profit = -betAmount;

    if (isWin) {
      payout = Number((betAmount * multiplier).toFixed(2));
      profit = Number((payout - betAmount).toFixed(2));
      
      // ─── 5. ACREDITAR PREMIO SI GANA ───
      // const updatedUser = await this.usersService.findById(userId);
      // await this.usersService.updateBalance(userId, updatedUser.balance + payout);
    }

    // Nota: Aquí podrías añadir el registro al historial global si lo necesitas

    return {
      roll,
      target,
      condition,
      winChance,
      multiplier,
      bet: betAmount,
      isWin,
      profit,
      payout,
      message: isWin 
        ? `¡Resultado: ${roll}! Victoria total. Has ganado $${payout}` 
        : `¡Resultado: ${roll}! La casa gana esta vez.`
    };
  }
}