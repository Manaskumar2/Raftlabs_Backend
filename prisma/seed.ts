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
      imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=80',
      isAvailable: true,
    },
    {
      id: 'item-burger',
      name: 'Classic Cheeseburger',
      description: 'Juicy beef patty with cheese, lettuce, and tomato',
      price: 199.00,
      imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
      isAvailable: true,
    },
    {
      id: 'item-pasta',
      name: 'Penne Arrabbiata',
      description: 'Spicy tomato sauce with garlic and fresh herbs',
      price: 249.00,
      imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&q=80',
      isAvailable: true,
    },
    {
      id: 'item-biryani',
      name: 'Chicken Biryani',
      description: 'Aromatic basmati rice cooked with tender chicken and spices',
      price: 349.00,
      imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80',
      isAvailable: true,
    },
    {
      id: 'item-sushi',
      name: 'California Roll',
      description: 'Crab meat, avocado, and cucumber rolled in seaweed and rice',
      price: 499.00,
      imageUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&q=80',
      isAvailable: false, // Testing unavailable item
    },
    {
      id: 'item-tacos',
      name: 'Chicken Tacos',
      description: 'Three soft corn tortillas with grilled chicken, salsa, and lime',
      price: 279.00,
      imageUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80',
      isAvailable: true,
    },
    {
      id: 'item-pad-thai',
      name: 'Pad Thai',
      description: 'Stir-fried rice noodles with eggs, peanuts, and bean sprouts',
      price: 329.00,
      imageUrl: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800&q=80',
      isAvailable: true,
    },
    {
      id: 'item-butter-chicken',
      name: 'Butter Chicken',
      description: 'Tender chicken in a rich, creamy tomato gravy',
      price: 399.00,
      imageUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800&q=80',
      isAvailable: true,
    },
    {
      id: 'item-caesar-salad',
      name: 'Caesar Salad',
      description: 'Crisp romaine lettuce with croutons, parmesan, and Caesar dressing',
      price: 229.00,
      imageUrl: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=800&q=80',
      isAvailable: true,
    },
    {
      id: 'item-cheesecake',
      name: 'New York Cheesecake',
      description: 'Classic creamy cheesecake with a graham cracker crust',
      price: 189.00,
      imageUrl: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=800&q=80',
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
