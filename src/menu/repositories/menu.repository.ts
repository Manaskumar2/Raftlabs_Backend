import { MenuItem } from '@prisma/client';

export abstract class MenuRepository {
  abstract findAll(): Promise<MenuItem[]>;
  abstract findById(id: string): Promise<MenuItem | null>;
  abstract findByIds(ids: string[]): Promise<MenuItem[]>;
}
