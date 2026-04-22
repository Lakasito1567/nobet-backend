import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async login(username: string, pass: string) {
    const user = await this.usersService.findOneByUsername(username);
    
    // Comparamos la contraseña escrita con la encriptada en la DB
    if (user && await bcrypt.compare(pass, user.password)) {
      const payload = { username: user.username, sub: user.id };
      return {
        access_token: this.jwtService.sign(payload),
        user: {
            id: user.id,
            username: user.username,
            balance: user.balance
        }
      };
    }
    throw new UnauthorizedException('Credenciales incorrectas');
  }
}