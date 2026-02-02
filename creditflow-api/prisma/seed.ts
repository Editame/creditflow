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

  // Crear tenant de prueba
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      name: 'Empresa Demo',
      slug: 'demo',
      plan: 'PROFESSIONAL',
      maxRoutes: 10,
      maxClients: 1000,
      maxUsers: 5,
    },
  });

  console.log('✅ Tenant creado:', tenant.name);

  // Crear usuario admin
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const user = await prisma.user.upsert({
    where: { 
      tenantId_username: {
        tenantId: tenant.id,
        username: 'admin'
      }
    },
    update: {},
    create: {
      tenantId: tenant.id,
      username: 'admin',
      email: 'admin@demo.com',
      password: hashedPassword,
      role: 'ADMIN',
      active: true,
    },
  });

  console.log('✅ Usuario creado:', user.username);
  console.log('\n📋 Credenciales de acceso:');
  console.log('   Usuario: admin');
  console.log('   Contraseña: admin123');
  console.log('   Tenant: demo\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
