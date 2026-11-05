import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { RestaurantsService } from './restaurants.service';

@Controller('restaurants')
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Get(':slug')
  async findBySlug(@Param('slug') slug: string) {
    const restaurant = await this.restaurantsService.findBySlug(slug);
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    return restaurant;
  }

  @Get(':slug/menu')
  async findMenuBySlug(@Param('slug') slug: string) {
    const menu = await this.restaurantsService.findMenuBySlug(slug);
    if (!menu) {
      throw new NotFoundException('Restaurant not found');
    }

    return menu;
  }
}
