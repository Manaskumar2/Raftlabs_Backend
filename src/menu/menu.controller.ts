import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiParam, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { MenuService } from './menu.service';
import { MenuItemResponseDto } from './dto/menu-item-response.dto';
import { ParseCuidPipe } from '../common/pipes/parse-cuid.pipe';

@ApiTags('Menu')
@Controller('api/v1/menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get()
  @ApiOperation({ summary: 'Get all available menu items' })
  @ApiResponse({
    status: 200,
    description: 'List of available menu items',
    type: [MenuItemResponseDto],
  })
  async findAll(): Promise<MenuItemResponseDto[]> {
    const items = await this.menuService.findAll();
    return items.map((item) => MenuItemResponseDto.fromEntity(item));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a menu item by ID' })
  @ApiParam({ name: 'id', description: 'Menu item ID' })
  @ApiResponse({
    status: 200,
    description: 'Menu item found',
    type: MenuItemResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Menu item not found' })
  async findOne(@Param('id', ParseCuidPipe) id: string): Promise<MenuItemResponseDto> {
    const item = await this.menuService.findById(id);
    return MenuItemResponseDto.fromEntity(item);
  }
}
