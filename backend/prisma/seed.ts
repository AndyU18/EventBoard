import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL no encontrada en las variables de entorno');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = 'admin@eventboard.com';
  
  await prisma.notification.deleteMany({});
  await prisma.eventLog.deleteMany({});
  await prisma.user.deleteMany({});

  const salt = await bcrypt.genSalt();
  const hashedPassword = await bcrypt.hash('admin123', salt);

  const admin = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name: 'Administrador EventBoard',
      role: Role.ADMIN,
    },
  });

  console.log(`✅ Usuario administrador por defecto creado:`);
  console.log(`📧 Email: ${admin.email}`);
  console.log(`🔑 Contraseña: admin123`);
  console.log(`👑 Rol: ${admin.role}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
