import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

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

main()
  .catch((e) => {
    console.error('❌ Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });