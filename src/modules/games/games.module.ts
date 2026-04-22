import { Module } from '@nestjs/common';
import { GamesController } from './games.controller';
import { BlackjackService } from './blackjack/blackjack.service';

@Module({
  controllers: [GamesController],
  providers: [BlackjackService],
  exports: [BlackjackService], 
})
export class GamesModule {}