import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { GamesModule } from './modules/games/games.module';

@Module({
  imports: [AuthModule, UsersModule, WalletModule, GamesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
