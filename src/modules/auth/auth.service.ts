import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  /**
   * Valida las credenciales y devuelve el token y los datos del usuario
   */
  async login(username: string, pass: string) {
    const user = await this.usersService.findOneByUsername(username);

    if (user && (await bcrypt.compare(pass, user.password))) {
      const payload = { username: user.username, sub: user.id };
      
      return {
        access_token: this.jwtService.sign(payload),
        user: {
          id: user.id,
          username: user.username,
          balance: user.balance,
        },
      };
    }

    throw new UnauthorizedException('Usuario o contraseña incorrectos');
  }

  /**
   * Crea un nuevo usuario y lo loguea automáticamente
   */
  async register(username: string, email: string, pass: string) {
    // Comprobamos si ya existe para dar un error limpio
    const existingUser = await this.usersService.findOneByUsername(username);
    if (existingUser) {
      throw new UnauthorizedException('El nombre de usuario ya está en uso');
    }

    const newUser = await this.usersService.create({ 
      username, 
      email, 
      password: pass 
    });

    return this.login(newUser.username, pass);
  }

  /**
   * ESTE ES EL MÉTODO QUE FALTA:
   * Recupera los datos del usuario para el Frontend basándose en el ID del Token
   */
  async getProfile(userId: number) {
    const user = await this.usersService.findOneById(userId);
    
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    // Devolvemos los datos limpios (importante para que el Front cargue el balance)
    return {
      id: user.id,
      username: user.username,
      balance: user.balance,
      email: user.email
    };
  }
}