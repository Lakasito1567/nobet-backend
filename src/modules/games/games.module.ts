import { Module } from '@nestjs/common';
import { GamesController } from './games.controller';
import { BlackjackService } from './blackjack/blackjack.service';
import { UsersModule } from '../users/users.module'; // Importamos el Módulo

@Module({
  imports: [UsersModule], // <--- ESTO ES LO QUE SOLUCIONA EL ERROR
  controllers: [GamesController],
  providers: [BlackjackService],
})
export class GamesModule {}