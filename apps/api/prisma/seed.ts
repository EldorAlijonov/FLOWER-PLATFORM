import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const serviceLogin = process.env.SERVICE_ADMIN_LOGIN;
  const servicePassword = process.env.SERVICE_ADMIN_PASSWORD;

  if (!serviceLogin || !servicePassword) {
    throw new Error('SERVICE_ADMIN_LOGIN and SERVICE_ADMIN_PASSWORD are required for auth seed.');
  }

  const existingServiceUser = await prisma.platformUser.findUnique({
    where: { login: serviceLogin },
  });

  if (!existingServiceUser) {
    await prisma.platformUser.create({
      data: {
        login: serviceLogin,
        passwordHash: await bcrypt.hash(servicePassword, 12),
        role: 'PLATFORM_SUPER_ADMIN',
        status: 'ACTIVE',
      },
    });
  }

  if (process.env.CREATE_DEV_TEST_DATA === 'true') {
    const shopName = process.env.DEV_TEST_SHOP_NAME ?? 'Lola Gullari';
    const shopUserLogin = process.env.DEV_TEST_SHOP_LOGIN ?? 'dinora';
    const shopUserPassword = process.env.DEV_TEST_SHOP_PASSWORD;

    if (!shopUserPassword) {
      throw new Error('DEV_TEST_SHOP_PASSWORD is required when CREATE_DEV_TEST_DATA=true.');
    }

    const shop = await prisma.shop.upsert({
      where: { id: process.env.DEV_TEST_SHOP_ID ?? '7d47b419-85ea-4c7d-9a28-31d74c2872f7' },
      create: {
        id: process.env.DEV_TEST_SHOP_ID ?? '7d47b419-85ea-4c7d-9a28-31d74c2872f7',
        name: shopName,
        status: 'ACTIVE',
      },
      update: {
        name: shopName,
        status: 'ACTIVE',
      },
    });

    const existingShopUser = await prisma.user.findUnique({
      where: { login: shopUserLogin },
    });

    if (!existingShopUser) {
      await prisma.user.create({
        data: {
          shopId: shop.id,
          fullName: process.env.DEV_TEST_SHOP_FULL_NAME ?? 'Dinora Owner',
          login: shopUserLogin,
          passwordHash: await bcrypt.hash(shopUserPassword, 12),
          role: 'OWNER',
          status: 'ACTIVE',
        },
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error.message);
    await prisma.$disconnect();
    process.exit(1);
  });
