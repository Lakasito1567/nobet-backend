import { Module } from '@nestjs/common';
import { GamesController } from './games.controller';
import { BlackjackService } from './blackjack/blackjack.service';
import { DiceService } from './dice/dice.service';
import { UsersModule } from '../users/users.module'; 
import { RouletteModule } from './roulette/roulette.module';

@Module({
  imports: [UsersModule, RouletteModule],
  controllers: [GamesController],
  providers: [
    BlackjackService, 
    DiceService
  ],
})
export class GamesModule {}