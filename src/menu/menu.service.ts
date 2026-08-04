import { Injectable } from '@nestjs/common';
import { MenuItem } from '@prisma/client';
import { MenuRepository } from './repositories/menu.repository';
import { MenuItemNotFoundException } from '../orders/exceptions/menu-item-not-found.exception';

@Injectable()
export class MenuService {
  constructor(private readonly menuRepository: MenuRepository) {}

  async findAll(): Promise<MenuItem[]> {
    return this.menuRepository.findAll();
  }

  async findById(id: string): Promise<MenuItem> {
    const menuItem = await this.menuRepository.findById(id);
    if (!menuItem) {
      throw new MenuItemNotFoundException(`Menu item with ID ${id} not found`);
    }
    return menuItem;
  }

  async findByIds(ids: string[]): Promise<MenuItem[]> {
    return this.menuRepository.findByIds(ids);
  }
}
