import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  const menuItems = [
    {
      id: 'item-pizza',
      name: 'Margherita Pizza',
      description: 'Classic cheese and tomato pizza with fresh basil',
      price: 299.00,
      imageUrl: 'https://placehold.co/400x300?text=Margherita+Pizza',
      isAvailable: true,
    },
    {
      id: 'item-burger',
      name: 'Classic Cheeseburger',
      description: 'Juicy beef patty with cheese, lettuce, and tomato',
      price: 199.00,
      imageUrl: 'https://placehold.co/400x300?text=Classic+Cheeseburger',
      isAvailable: true,
    },
    {
      id: 'item-pasta',
      name: 'Penne Arrabbiata',
      description: 'Spicy tomato sauce with garlic and fresh herbs',
      price: 249.00,
      imageUrl: 'https://placehold.co/400x300?text=Penne+Arrabbiata',
      isAvailable: true,
    },
    {
      id: 'item-biryani',
      name: 'Chicken Biryani',
      description: 'Aromatic basmati rice cooked with tender chicken and spices',
      price: 349.00,
      imageUrl: 'https://placehold.co/400x300?text=Chicken+Biryani',
      isAvailable: true,
    },
    {
      id: 'item-sushi',
      name: 'California Roll',
      description: 'Crab meat, avocado, and cucumber rolled in seaweed and rice',
      price: 499.00,
      imageUrl: 'https://placehold.co/400x300?text=California+Roll',
      isAvailable: false, // Testing unavailable item
    },
    {
      id: 'item-tacos',
      name: 'Chicken Tacos',
      description: 'Three soft corn tortillas with grilled chicken, salsa, and lime',
      price: 279.00,
      imageUrl: 'https://placehold.co/400x300?text=Chicken+Tacos',
      isAvailable: true,
    },
    {
      id: 'item-pad-thai',
      name: 'Pad Thai',
      description: 'Stir-fried rice noodles with eggs, peanuts, and bean sprouts',
      price: 329.00,
      imageUrl: 'https://placehold.co/400x300?text=Pad+Thai',
      isAvailable: true,
    },
    {
      id: 'item-butter-chicken',
      name: 'Butter Chicken',
      description: 'Tender chicken in a rich, creamy tomato gravy',
      price: 399.00,
      imageUrl: 'https://placehold.co/400x300?text=Butter+Chicken',
      isAvailable: true,
    },
    {
      id: 'item-caesar-salad',
      name: 'Caesar Salad',
      description: 'Crisp romaine lettuce with croutons, parmesan, and Caesar dressing',
      price: 229.00,
      imageUrl: 'https://placehold.co/400x300?text=Caesar+Salad',
      isAvailable: true,
    },
    {
      id: 'item-cheesecake',
      name: 'New York Cheesecake',
      description: 'Classic creamy cheesecake with a graham cracker crust',
      price: 189.00,
      imageUrl: 'https://placehold.co/400x300?text=New+York+Cheesecake',
      isAvailable: true,
    },
  ];

  for (const item of menuItems) {
    await prisma.menuItem.upsert({
      where: { id: item.id },
      update: {
        name: item.name,
        description: item.description,
        price: item.price,
        imageUrl: item.imageUrl,
        isAvailable: item.isAvailable,
      },
      create: {
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        imageUrl: item.imageUrl,
        isAvailable: item.isAvailable,
      },
    });
    console.log(`Upserted menu item: ${item.name}`);
  }

  const bcrypt = require('bcrypt');
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      id: 'admin-1',
      email: 'admin@example.com',
      password: passwordHash,
      name: 'Admin User',
      role: 'ADMIN',
    },
  });
  console.log('Upserted Admin user');

  await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      id: 'customer-1',
      email: 'customer@example.com',
      password: passwordHash,
      name: 'Customer User',
      role: 'CUSTOMER',
    },
  });
  console.log('Upserted Customer user');

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
