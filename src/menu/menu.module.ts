import { Module } from '@nestjs/common';
import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';
import { MenuRepository } from './repositories/menu.repository';
import { PrismaMenuRepository } from './repositories/prisma-menu.repository';

@Module({
  controllers: [MenuController],
  providers: [
    MenuService,
    {
      provide: MenuRepository,
      useClass: PrismaMenuRepository,
    },
  ],
  exports: [MenuService],
})
export class MenuModule {}
