import { ApiProperty } from '@nestjs/swagger';
import { MenuItem } from '@prisma/client';

export class MenuItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  price: string;

  @ApiProperty()
  imageUrl: string | null;

  @ApiProperty()
  isAvailable: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromEntity(menuItem: MenuItem): MenuItemResponseDto {
    const dto = new MenuItemResponseDto();
    dto.id = menuItem.id;
    dto.name = menuItem.name;
    dto.description = menuItem.description;
    dto.price = menuItem.price.toString();
    dto.imageUrl = menuItem.imageUrl;
    dto.isAvailable = menuItem.isAvailable;
    dto.createdAt = menuItem.createdAt;
    dto.updatedAt = menuItem.updatedAt;
    return dto;
  }
}
