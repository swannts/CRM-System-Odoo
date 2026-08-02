import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AvailabilityService } from './availability.service.js';
import { CreateAvailabilityDto } from './dto/create-availability.dto.js';
import { UpdateAvailabilityDto } from './dto/update-availability.dto.js';

@ApiTags('availability')
@Controller('v1/availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get()
  @ApiOperation({ summary: 'List availability rules for organization' })
  findAll(@Headers('X-Org-Id') orgId: string, @Query('bookingTypeId') bookingTypeId?: string) {
    return this.availabilityService.findAll(orgId, bookingTypeId);
  }

  @Post()
  @ApiOperation({ summary: 'Create availability rule' })
  create(@Headers('X-Org-Id') orgId: string, @Body() payload: CreateAvailabilityDto) {
    return this.availabilityService.create(orgId, payload);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update availability rule' })
  update(@Headers('X-Org-Id') orgId: string, @Param('id') id: string, @Body() payload: UpdateAvailabilityDto) {
    return this.availabilityService.update(orgId, id, payload);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete availability rule' })
  remove(@Headers('X-Org-Id') orgId: string, @Param('id') id: string) {
    return this.availabilityService.remove(orgId, id);
  }
}
