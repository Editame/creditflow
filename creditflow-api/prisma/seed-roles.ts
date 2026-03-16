import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seedRolesAndPermissions() {
  console.log('🔐 Seeding roles and permissions...');

  // Definir permisos por módulo
  const permissions = [
    // CLIENTES
    { name: 'clients.view', description: 'Ver clientes', module: 'CLIENTS' },
    { name: 'clients.create', description: 'Crear clientes', module: 'CLIENTS' },
    { name: 'clients.edit', description: 'Editar clientes', module: 'CLIENTS' },
    { name: 'clients.delete', description: 'Eliminar clientes', module: 'CLIENTS' },
    { name: 'clients.block', description: 'Bloquear/desbloquear clientes', module: 'CLIENTS' },

    // PRÉSTAMOS
    { name: 'loans.view', description: 'Ver préstamos', module: 'LOANS' },
    { name: 'loans.create', description: 'Crear préstamos', module: 'LOANS' },
    { name: 'loans.edit', description: 'Editar préstamos', module: 'LOANS' },
    { name: 'loans.delete', description: 'Eliminar préstamos', module: 'LOANS' },
    { name: 'loans.refinance', description: 'Refinanciar préstamos', module: 'LOANS' },

    // PAGOS
    { name: 'payments.view', description: 'Ver pagos', module: 'PAYMENTS' },
    { name: 'payments.create', description: 'Registrar pagos', module: 'PAYMENTS' },
    { name: 'payments.edit', description: 'Editar pagos', module: 'PAYMENTS' },
    { name: 'payments.delete', description: 'Eliminar pagos', module: 'PAYMENTS' },

    // RUTAS
    { name: 'routes.view', description: 'Ver rutas', module: 'ROUTES' },
    { name: 'routes.create', description: 'Crear rutas', module: 'ROUTES' },
    { name: 'routes.edit', description: 'Editar rutas', module: 'ROUTES' },
    { name: 'routes.delete', description: 'Eliminar rutas', module: 'ROUTES' },
    { name: 'routes.assign', description: 'Asignar clientes a rutas', module: 'ROUTES' },

    // GASTOS
    { name: 'expenses.view', description: 'Ver gastos', module: 'EXPENSES' },
    { name: 'expenses.create', description: 'Crear gastos', module: 'EXPENSES' },
    { name: 'expenses.edit', description: 'Editar gastos', module: 'EXPENSES' },
    { name: 'expenses.delete', description: 'Eliminar gastos', module: 'EXPENSES' },

    // USUARIOS
    { name: 'users.view', description: 'Ver usuarios', module: 'USERS' },
    { name: 'users.create', description: 'Crear usuarios', module: 'USERS' },
    { name: 'users.edit', description: 'Editar usuarios', module: 'USERS' },
    { name: 'users.delete', description: 'Eliminar usuarios', module: 'USERS' },
    { name: 'users.roles', description: 'Gestionar roles de usuarios', module: 'USERS' },

    // REPORTES
    { name: 'reports.basic', description: 'Ver reportes básicos', module: 'REPORTS' },
    { name: 'reports.advanced', description: 'Ver reportes avanzados', module: 'REPORTS' },
    { name: 'reports.export', description: 'Exportar reportes', module: 'REPORTS' },

    // DASHBOARD
    { name: 'dashboard.view', description: 'Ver dashboard', module: 'DASHBOARD' },
    { name: 'dashboard.metrics', description: 'Ver métricas del dashboard', module: 'DASHBOARD' },

    // CONCEPTOS DE COBRO
    { name: 'concepts.view', description: 'Ver conceptos de cobro', module: 'CONCEPTS' },
    { name: 'concepts.create', description: 'Crear conceptos de cobro', module: 'CONCEPTS' },
    { name: 'concepts.edit', description: 'Editar conceptos de cobro', module: 'CONCEPTS' },
    { name: 'concepts.delete', description: 'Eliminar conceptos de cobro', module: 'CONCEPTS' },

    // CONFIGURACIÓN
    { name: 'settings.view', description: 'Ver configuración', module: 'SETTINGS' },
    { name: 'settings.edit', description: 'Editar configuración', module: 'SETTINGS' },
    { name: 'settings.tenant', description: 'Gestionar configuración del tenant', module: 'SETTINGS' },

    // AUDITORÍA
    { name: 'audit.view', description: 'Ver logs de auditoría', module: 'AUDIT' },
  ];

  // Crear permisos
  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: {},
      create: permission,
    });
  }

  console.log(`✅ ${permissions.length} permisos creados/actualizados`);

  // Definir roles con sus permisos
  const roles = [
    {
      name: 'SUPER_ADMIN',
      description: 'Administrador maestro del sistema',
      permissions: permissions.map(p => p.name), // Todos los permisos
    },
    {
      name: 'ADMIN',
      description: 'Administrador del tenant',
      permissions: [
        // Todos los permisos excepto configuración del sistema
        'clients.view', 'clients.create', 'clients.edit', 'clients.delete', 'clients.block',
        'loans.view', 'loans.create', 'loans.edit', 'loans.delete', 'loans.refinance',
        'payments.view', 'payments.create', 'payments.edit', 'payments.delete',
        'routes.view', 'routes.create', 'routes.edit', 'routes.delete', 'routes.assign',
        'expenses.view', 'expenses.create', 'expenses.edit', 'expenses.delete',
        'users.view', 'users.create', 'users.edit', 'users.delete', 'users.roles',
        'reports.basic', 'reports.advanced', 'reports.export',
        'dashboard.view', 'dashboard.metrics',
        'concepts.view', 'concepts.create', 'concepts.edit', 'concepts.delete',
        'settings.view', 'settings.edit', 'settings.tenant',
        'audit.view',
      ],
    },
    {
      name: 'SUPERVISOR',
      description: 'Supervisor de rutas y cobradores',
      permissions: [
        'clients.view', 'clients.create', 'clients.edit', 'clients.block',
        'loans.view', 'loans.create', 'loans.edit', 'loans.refinance',
        'payments.view', 'payments.create', 'payments.edit',
        'routes.view', 'routes.assign',
        'expenses.view', 'expenses.create', 'expenses.edit',
        'users.view',
        'reports.basic', 'reports.advanced',
        'dashboard.view', 'dashboard.metrics',
        'concepts.view',
      ],
    },
    {
      name: 'COLLECTOR',
      description: 'Cobrador de ruta',
      permissions: [
        'clients.view',
        'loans.view',
        'payments.view', 'payments.create',
        'routes.view',
        'expenses.view', 'expenses.create',
        'dashboard.view',
      ],
    },
    {
      name: 'ACCOUNTANT',
      description: 'Contador/Contable',
      permissions: [
        'clients.view',
        'loans.view',
        'payments.view',
        'routes.view',
        'expenses.view', 'expenses.create', 'expenses.edit',
        'reports.basic', 'reports.advanced', 'reports.export',
        'dashboard.view', 'dashboard.metrics',
        'concepts.view',
      ],
    },
  ];

  // Crear roles y asignar permisos
  for (const roleData of roles) {
    const role = await prisma.role.upsert({
      where: { name: roleData.name },
      update: { description: roleData.description },
      create: {
        name: roleData.name,
        description: roleData.description,
      },
    });

    // Limpiar permisos existentes del rol
    await prisma.rolePermission.deleteMany({
      where: { roleId: role.id },
    });

    // Asignar nuevos permisos
    for (const permissionName of roleData.permissions) {
      const permission = await prisma.permission.findUnique({
        where: { name: permissionName },
      });

      if (permission) {
        await prisma.rolePermission.create({
          data: {
            roleId: role.id,
            permissionId: permission.id,
          },
        });
      }
    }

    console.log(`✅ Rol ${role.name} creado con ${roleData.permissions.length} permisos`);
  }

  console.log('🔐 Roles y permisos seeded exitosamente');
}

async function main() {
  try {
    await seedRolesAndPermissions();
  } catch (error) {
    console.error('❌ Error seeding roles and permissions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { seedRolesAndPermissions };