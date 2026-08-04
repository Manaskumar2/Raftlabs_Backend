import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserRepository } from './repositories/user.repository';
import { PrismaUserRepository } from './repositories/prisma-user.repository';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [
    UsersService,
    {
      provide: UserRepository,
      useClass: PrismaUserRepository,
    },
  ],
  exports: [UsersService],
})
export class UsersModule {}
