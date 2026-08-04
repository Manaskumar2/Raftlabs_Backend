import { Prisma, User } from '@prisma/client';

export abstract class UserRepository {
  abstract findByEmail(email: string): Promise<User | null>;
  abstract create(data: Prisma.UserCreateInput): Promise<User>;
}
