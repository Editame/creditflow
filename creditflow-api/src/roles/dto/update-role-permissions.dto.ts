import { IsArray, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateRolePermissionsDto {
  @ApiProperty({
    description: 'Array of permission IDs to assign to role',
    example: [1, 2, 3, 4, 5],
    type: [Number],
  })
  @IsArray()
  @IsInt({ each: true })
  permissionIds!: number[];
}
