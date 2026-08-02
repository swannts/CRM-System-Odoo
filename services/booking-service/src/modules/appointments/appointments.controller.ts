import { Controller, Get, Post, Body, Patch, Param, Delete, Headers, Query, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service.js';
import { CreateAppointmentDto } from './dto/create-appointment.dto.js';
import { UpdateAppointmentDto } from './dto/update-appointment.dto.js';

@ApiTags('appointments')
@Controller('v1/appointments')
export class AppointmentsController {
  private readonly appointmentsService: AppointmentsService;

  constructor(@Inject(AppointmentsService) appointmentsService: AppointmentsService) {
    this.appointmentsService = appointmentsService;
    this.create = this.create.bind(this);
    this.createPublic = this.createPublic.bind(this);
    this.findAll = this.findAll.bind(this);
    this.getAvailableSlots = this.getAvailableSlots.bind(this);
    this.findOne = this.findOne.bind(this);
    this.update = this.update.bind(this);
    this.remove = this.remove.bind(this);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new appointment' })
  create(
    @Headers('X-Org-Id') orgId: string,
    @Body() createAppointmentDto: CreateAppointmentDto
  ) {
    return this.appointmentsService.create(orgId, createAppointmentDto);
  }

  @Post('public')
  @ApiOperation({ summary: 'Create a new appointment from public landing page' })
  createPublic(@Body() createAppointmentDto: CreateAppointmentDto) {
    return this.appointmentsService.createPublic(createAppointmentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all appointments for an organization' })
  findAll(
    @Headers('X-Org-Id') orgId: string,
    @Query('contactId') contactId?: string
  ) {
    return this.appointmentsService.findAll(orgId, contactId);
  }

  @Get('available-slots')
  @ApiOperation({ summary: 'Get available slots for a booking type on a specific date' })
  getAvailableSlots(
    @Query('bookingTypeId') bookingTypeId: string,
    @Query('date') date: string
  ) {
    return this.appointmentsService.getAvailableSlots(bookingTypeId, date);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific appointment' })
  findOne(@Headers('X-Org-Id') orgId: string, @Param('id') id: string) {
    return this.appointmentsService.findOne(orgId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an appointment status' })
  update(@Headers('X-Org-Id') orgId: string, @Param('id') id: string, @Body() updateAppointmentDto: UpdateAppointmentDto) {
    return this.appointmentsService.update(orgId, id, updateAppointmentDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel an appointment' })
  remove(@Headers('X-Org-Id') orgId: string, @Param('id') id: string) {
    return this.appointmentsService.update(orgId, id, { status: 'CANCELLED' });
  }
}
