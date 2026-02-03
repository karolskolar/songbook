import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaLibSql } from '@prisma/adapter-libsql';

const databaseUrl = process.env.DATABASE_URL || 'file:./prisma/dev.db';
console.log('Using database:', databaseUrl);

const adapter = new PrismaLibSql({
  url: databaseUrl,
});

export const prisma = new PrismaClient({ adapter });

export async function connectDb() {
  await prisma.$connect();
  console.log('Database connected');
}

export async function disconnectDb() {
  await prisma.$disconnect();
}
