export interface RestaurantConfig {
  name: string;
  slug: string;
  tagline: string;
  currency: 'ARS';
  locale: 'es-AR';
  branding: {
    primaryColor: string;
    secondaryColor: string;
    logoUrl?: string;
  };
  tips: {
    enabled: boolean;
    defaultPercentage: number;
    optionsPercentages: number[];
  };
}

export const restaurantConfig: RestaurantConfig = {
  name: 'Restaurante AR',
  slug: 'restaurante-ar',
  tagline: 'Sabor argentino y experiencia WebAR',
  currency: 'ARS',
  locale: 'es-AR',
  branding: {
    primaryColor: '#D97706',
    secondaryColor: '#1F2937',
  },
  tips: {
    enabled: true,
    defaultPercentage: 10,
    optionsPercentages: [5, 10, 15],
  },
};
