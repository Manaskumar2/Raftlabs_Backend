import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

export class CreateOrderItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  menuItemId: string;

  @ApiProperty({ minimum: 1, maximum: 100 })
  @IsInt()
  @Min(1)
  @Max(100)
  quantity: number;
}
