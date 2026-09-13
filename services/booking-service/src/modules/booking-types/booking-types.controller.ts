import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BookingTypesService } from './booking-types.service.js';
import { CreateBookingTypeDto } from './dto/create-booking-type.dto.js';
import { UpdateBookingTypeDto } from './dto/update-booking-type.dto.js';

@ApiTags('booking-types')
@Controller('v1/booking-types')
export class BookingTypesController {
  constructor(private readonly bookingTypesService: BookingTypesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new booking type' })
  create(
    @Headers('X-Org-Id') orgId: string,
    @Body() createBookingTypeDto: CreateBookingTypeDto
  ) {
    return this.bookingTypesService.create(orgId, createBookingTypeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all booking types for an organization' })
  findAll(@Headers('X-Org-Id') orgId: string) {
    return this.bookingTypesService.findAll(orgId);
  }

  @Get(':idOrSlug')
  @ApiOperation({ summary: 'Get a specific booking type by ID or Slug' })
  findOne(@Param('idOrSlug') idOrSlug: string) {
    return this.bookingTypesService.findOne(idOrSlug);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a booking type' })
  update(@Headers('X-Org-Id') orgId: string, @Param('id') id: string, @Body() updateBookingTypeDto: UpdateBookingTypeDto) {
    return this.bookingTypesService.update(orgId, id, updateBookingTypeDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a booking type' })
  remove(@Headers('X-Org-Id') orgId: string, @Param('id') id: string) {
    return this.bookingTypesService.remove(orgId, id);
  }
}
