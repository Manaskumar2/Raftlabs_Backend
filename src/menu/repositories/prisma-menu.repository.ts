import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MenuRepository } from './menu.repository';
import { MenuItem } from '@prisma/client';

@Injectable()
export class PrismaMenuRepository implements MenuRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<MenuItem[]> {
    return this.prisma.menuItem.findMany({
      where: {
        isAvailable: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findById(id: string): Promise<MenuItem | null> {
    return this.prisma.menuItem.findUnique({
      where: { id },
    });
  }

  async findByIds(ids: string[]): Promise<MenuItem[]> {
    return this.prisma.menuItem.findMany({
      where: {
        id: {
          in: ids,
        },
      },
    });
  }
}
