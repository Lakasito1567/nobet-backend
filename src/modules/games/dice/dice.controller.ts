import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { DiceService } from './dice.service';
import type * as DiceTypes from './dice.service';

@Controller('games/dice')
export class DiceController {
  constructor(private readonly diceService: DiceService) {}

  @Post('roll')
    async playDice(@Req() req, @Body() dto: DiceTypes.DiceRollDto) {
    const userId = req.user.id; 
    return this.diceService.roll(userId, dto);
    } 
}