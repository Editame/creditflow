import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { seedRolesAndPermissions } from './seed-roles';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // Seed roles y permisos primero
  await seedRolesAndPermissions();

  // Crear usuario SUPER_ADMIN (sin tenant - es el maestro del sistema)
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const superAdmin = await prisma.user.create({
    data: {
      tenantId: null, // Sin tenant - es el usuario maestro
      username: 'admin',
      email: 'admin@creditflow.com',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      active: true,
    },
  });

  console.log('✅ SUPER_ADMIN creado:', superAdmin.username);

  // Crear tenant de demo para pruebas
  const demoTenant = await prisma.tenant.create({
    data: {
      name: 'Empresa Demo',
      slug: 'demo',
      plan: 'PROFESSIONAL',
      maxRoutes: 10,
      maxClients: 1000,
      maxUsers: 5,
    },
  });

  console.log('✅ Tenant demo creado:', demoTenant.name);

  // Inicializar features del tenant según su plan
  const defaultFeatures = getDefaultFeaturesForPlan(demoTenant.plan);
  for (const { module, enabled } of defaultFeatures) {
    await prisma.tenantFeature.upsert({
      where: { tenantId_module: { tenantId: demoTenant.id, module } },
      update: { enabled },
      create: { tenantId: demoTenant.id, module, enabled },
    });
  }
  console.log('✅ Features inicializadas para tenant demo');

  // Crear usuario admin del tenant demo
  const tenantAdmin = await prisma.user.create({
    data: {
      tenantId: demoTenant.id,
      username: 'demo-admin',
      email: 'demo@creditflow.com',
      password: hashedPassword,
      role: 'ADMIN',
      active: true,
    },
  });

  console.log('✅ Admin del tenant demo creado:', tenantAdmin.username);

  console.log('\n📋 Credenciales de acceso:');
  console.log('🔑 SUPER_ADMIN (Maestro del sistema):');
  console.log('   Usuario: admin');
  console.log('   Contraseña: admin123');
  console.log('   Rol: SUPER_ADMIN (sin tenant)');
  console.log('\n🏢 ADMIN del tenant demo:');
  console.log('   Usuario: demo-admin');
  console.log('   Contraseña: admin123');
  console.log('   Tenant: demo');
  console.log('   Rol: ADMIN\n');
}

function getDefaultFeaturesForPlan(plan: string) {
  const core = [
    { module: 'CLIENTS_BASIC' as const, enabled: true },
    { module: 'LOANS_BASIC' as const, enabled: true },
    { module: 'PAYMENTS_BASIC' as const, enabled: true },
    { module: 'ROUTES_BASIC' as const, enabled: true },
  ];
  const advanced = [
    { module: 'EXPENSES' as const, enabled: plan !== 'BASIC' },
    { module: 'REPORTS_ADVANCED' as const, enabled: false },
    { module: 'USERS_MANAGEMENT' as const, enabled: plan !== 'BASIC' },
    { module: 'API_REST' as const, enabled: false },
    { module: 'EXPORT_EXCEL' as const, enabled: false },
    { module: 'CONCEPTS_CUSTOM' as const, enabled: plan !== 'BASIC' },
    { module: 'REFINANCING' as const, enabled: plan !== 'BASIC' },
  ];
  const enterprise = [
    { module: 'WHITE_LABEL' as const, enabled: false },
    { module: 'CUSTOM_DOMAIN' as const, enabled: false },
    { module: 'WEBHOOKS' as const, enabled: false },
    { module: 'SSO' as const, enabled: false },
    { module: 'AUDIT_LOGS' as const, enabled: plan === 'ENTERPRISE' },
    { module: 'CUSTOM_REPORTS' as const, enabled: false },
    { module: 'ROLES_PERMISSIONS' as const, enabled: plan === 'ENTERPRISE' },
  ];
  return [...core, ...advanced, ...enterprise];
}

main()
  .catch((e) => {
    console.error('❌ Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });