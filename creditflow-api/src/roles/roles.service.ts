import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.role.findMany({
      where: {
        name: { not: 'SUPER_ADMIN' },
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async create(createRoleDto: { name: string }) {
    const { name } = createRoleDto;

    const existingRole = await this.prisma.role.findFirst({
      where: { name: name.toUpperCase() },
    });

    if (existingRole) {
      throw new ConflictException(`Role with name '${name}' already exists`);
    }

    return this.prisma.role.create({
      data: {
        name: name.toUpperCase(),
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    if (role.name === 'SUPER_ADMIN') {
      throw new NotFoundException('Cannot access SUPER_ADMIN role');
    }

    return role;
  }

  async getRolePermissions(roleId: number) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    if (role.name === 'SUPER_ADMIN') {
      throw new NotFoundException('Cannot access SUPER_ADMIN role permissions');
    }

    return role.permissions;
  }

  async updateRolePermissions(roleId: number, permissionIds: number[]) {
    await this.findOne(roleId);

    await this.prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({
        where: { roleId },
      });

      if (permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: permissionIds.map((permissionId) => ({
            roleId,
            permissionId,
          })),
        });
      }
    });

    return this.findOne(roleId);
  }
}
