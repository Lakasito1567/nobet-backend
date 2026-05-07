import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  /**
   * Crea un nuevo usuario con contraseña encriptada
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(createUserDto.password, salt);

      const newUser = this.usersRepository.create({
        username: createUserDto.username,
        email: createUserDto.email,
        password: hashedPassword,
        balance: 1000, // Saldo inicial por defecto
      });

      return await this.usersRepository.save(newUser);
    } catch (error: unknown) {
      console.error("Error creando usuario:", error);

      // Verificamos si el error tiene la propiedad 'code' (PostgreSQL/MySQL duplicados)
      if (typeof error === 'object' && error !== null && 'code' in error) {
        const dbError = error as { code: string };
        if (dbError.code === '23505') {
          throw new BadRequestException('El usuario o email ya existe');
        }
      }

      throw error;
    }
  }

  /**
   * Busca por nombre de usuario (utilizado en Login)
   */
  async findOneByUsername(username: string): Promise<User | null> {
    // Usamos findOne con where para mayor compatibilidad
    return await this.usersRepository.findOne({ where: { username } });
  }

  /**
   * Busca por ID (utilizado en el Profile y Guards)
   */
  async findOneById(id: number): Promise<User | null> {
    return await this.usersRepository.findOne({ where: { id } });
  }

  async getLeaderboard(): Promise<User[]> {
  return await this.usersRepository.find({
      order: { balance: 'DESC' }, // Ordenar de mayor a menor
      take: 10, // Solo los 10 mejores
      select: ['username', 'balance'] // Por seguridad, solo enviamos estos campos
    });
  }

  /**
   * Actualiza el balance del usuario (Blackjack)
   */
  async updateBalance(userId: number, amount: number): Promise<User> {
    const user = await this.findOneById(userId);
    if (!user) throw new NotFoundException('Usuario no encontrado');

    // Convertimos el balance a número (TypeORM devuelve decimales como strings)
    const currentBalance = parseFloat(user.balance.toString());
    const newBalance = currentBalance + amount;

    if (newBalance < 0) {
      throw new BadRequestException('Saldo insuficiente para esta apuesta');
    }

    user.balance = newBalance;
    return await this.usersRepository.save(user);
  }
}