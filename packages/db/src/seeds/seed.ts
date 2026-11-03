import { db, queryClient } from '../client';
import { restaurantSettings, users, tables, menuCategories, menuItems } from '../schema';

async function seed() {
  console.log('Seeding initial restaurant data...');

  try {
    // 1. Restaurant Settings
    await db.insert(restaurantSettings).values({
      name: 'Parrilla La Estancia AR',
      cuit: '30-71234567-8',
      timezone: 'America/Argentina/Buenos_Aires',
      brand: {
        primaryColor: '#D97706',
        secondaryColor: '#1F2937',
        logoUrl: '/logo.png',
        tagline: 'Las mejores carnes a la parrilla y experiencia WebAR',
      },
      tipOptions: {
        enabled: true,
        defaultPercentage: 10,
        optionsPercentages: [5, 10, 15],
      },
      tipDestinationMode: 'ACCOUNTING_SEPARATION',
    });

    // 2. Initial Admin User
    await db
      .insert(users)
      .values({
        email: 'admin@laestancia.com.ar',
        name: 'Administrador La Estancia',
        role: 'owner',
      });

    // 3. Initial Tables
    await db.insert(tables).values([
      { label: 'Mesa 1', qrVersion: 1, active: true },
      { label: 'Mesa 2', qrVersion: 1, active: true },
      { label: 'Mesa 3', qrVersion: 1, active: true },
      { label: 'Barra 1', qrVersion: 1, active: true },
    ]);

    // 4. Initial Categories
    const [catEntradas] = await db
      .insert(menuCategories)
      .values({ name: 'Entradas', position: 1, active: true })
      .returning();

    const [catParrilla] = await db
      .insert(menuCategories)
      .values({ name: 'Parrilla Tradicional', position: 2, active: true })
      .returning();

    // 5. Initial Menu Items
    await db.insert(menuItems).values([
      {
        categoryId: catEntradas.id,
        name: 'Empanada de Carne Cortada a Cuchillo',
        description: 'Empanada tucumana frita o al horno',
        priceCents: 150000,
        allergens: ['gluten'],
        station: 'kitchen',
        available: true,
      },
      {
        categoryId: catParrilla.id,
        name: 'Ojo de Bife 400g con Papas Fritas',
        description: 'Corte premium de novillo madurado',
        priceCents: 1850000,
        allergens: [],
        station: 'kitchen',
        available: true,
      },
    ]);

    console.log('Database seed completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await queryClient.end();
  }
}

seed();
