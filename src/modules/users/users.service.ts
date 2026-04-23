import { Injectable } from '@nestjs/common';
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

  async create(createUserDto: CreateUserDto): Promise<User> {
  try {
    const salt = await bcrypt.genSalt(10); // Generamos el salto explícitamente
    const hashedPassword = await bcrypt.hash(createUserDto.password, salt);

    const newUser = this.usersRepository.create({
      username: createUserDto.username,
      email: createUserDto.email,
      password: hashedPassword,
    });

    return await this.usersRepository.save(newUser);
  } catch (error) {
    console.error("Error creando usuario:", error);
    throw error; // Esto nos dirá en la consola qué falló exactamente
  }
}
  
  async findOneByUsername(username: string): Promise<User | null> {
  return await this.usersRepository.findOneBy({ username });
}

async updateBalance(userId: number, amount: number): Promise<User> {
  const user = await this.usersRepository.findOneBy({ id: userId });
  if (!user) throw new Error('Usuario no encontrado');

  const currentBalance = parseFloat(user.balance.toString());
  const newBalance = currentBalance + amount;

  if (newBalance < 0) {
    throw new Error('Saldo insuficiente para esta apuesta');
  }

  user.balance = newBalance;
  return await this.usersRepository.save(user);
}

}