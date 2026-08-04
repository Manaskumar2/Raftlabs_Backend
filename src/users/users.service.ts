import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { UserRepository } from './repositories/user.repository';

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UserRepository) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.userRepository.create(data);
  }
}
