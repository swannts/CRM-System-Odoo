import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Query,
  Param,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiHeader,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { ContactsService } from './contacts.service.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { ContactEntity } from './entities/contact.entity.js';
import { CreateContactDto, UpdateContactDto } from './dto/contact.dto.js';
import { IdentityGuard } from '../../common/guards/identity.guard.js';

@ApiTags('Contacts')
@UseGuards(IdentityGuard)
@ApiHeader({ name: 'x-user-id', required: true })
@ApiHeader({ name: 'x-org-id', required: true })
@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post('import')
  @ApiOperation({ summary: 'Import contacts from CSV' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  async import(@UploadedFile() file: Express.Multer.File) {
    return this.contactsService.import(file);
  }

  @Get()
  @ApiOperation({ summary: 'List all contacts' })
  @ApiResponse({ status: 200, type: [ContactEntity] })
  async findAll(@Query() paginationDto: PaginationDto) {
    const pageSize = Math.max(1, Math.min(100, Number(paginationDto.pageSize || 10)));
    const page = Math.max(1, Number(paginationDto.page || 1));
    const active = paginationDto.active !== undefined ? paginationDto.active : true;
    return this.contactsService.findAll({ ...paginationDto, pageSize, page, active });
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get contacts analytics' })
  async getAnalytics(@Query() paginationDto: PaginationDto) {
    const pageSize = Math.max(1, Math.min(100, Number(paginationDto.pageSize || 10)));
    const page = Math.max(1, Number(paginationDto.page || 1));
    return this.contactsService.getAnalytics({ ...paginationDto, pageSize, page });
  }

  // --- Companies ---
  @Get('companies')
  @ApiOperation({ summary: 'List all companies' })
  async getCompanies(@Query() paginationDto: PaginationDto) {
    const pageSize = Math.max(1, Math.min(100, Number(paginationDto.pageSize || 10)));
    const page = Math.max(1, Number(paginationDto.page || 1));
    const active = paginationDto.active !== undefined ? paginationDto.active : true;
    return this.contactsService.getCompanies({ ...paginationDto, pageSize, page, active });
  }

  @Get('companies/:id')
  @ApiOperation({ summary: 'Get company details' })
  async findCompany(@Param('id', ParseIntPipe) id: number) {
    return this.contactsService.findCompany(id);
  }

  @Post('companies')
  @ApiOperation({ summary: 'Create a new company' })
  async createCompany(@Body() data: any) {
    return this.contactsService.createCompany(data);
  }

  @Put('companies/:id')
  @ApiOperation({ summary: 'Update a company' })
  async updateCompany(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: any,
  ) {
    return this.contactsService.updateCompany(id, data);
  }

  @Delete('companies/:id')
  @ApiOperation({ summary: 'Delete a company' })
  async removeCompany(@Param('id', ParseIntPipe) id: number) {
    return this.contactsService.removeCompany(id);
  }

  @Get('companies/:id/contacts')
  @ApiOperation({ summary: 'Get contacts belonging to a company' })
  async getCompanyContacts(@Param('id', ParseIntPipe) id: number) {
    return this.contactsService.getCompanyContacts(id);
  }

  @Post(':contactId/link-company')
  @ApiOperation({ summary: 'Link a contact to a company' })
  async linkCompany(
    @Param('contactId') contactId: string,
    @Body('companyId', ParseIntPipe) companyId: number,
  ) {
    const odooContactId = /^\d+$/.test(contactId)
      ? Number(contactId)
      : await this.contactsService.resolveUuid(contactId);
    if (!odooContactId) throw new Error('Contact not found');
    return this.contactsService.linkCompany(odooContactId, companyId);
  }

  @Post(':contactId/unlink-company')
  @ApiOperation({ summary: 'Unlink a contact from its company' })
  async unlinkCompany(@Param('contactId') contactId: string) {
    const odooContactId = /^\d+$/.test(contactId)
      ? Number(contactId)
      : await this.contactsService.resolveUuid(contactId);
    if (!odooContactId) throw new Error('Contact not found');
    return this.contactsService.unlinkCompany(odooContactId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get contact details' })
  @ApiResponse({ status: 200, type: ContactEntity })
  async findOne(@Param('id') id: string) {
    // Check if ID is a numeric string (Odoo ID) or UUID
    if (/^\d+$/.test(id)) {
      return this.contactsService.findOne(Number(id));
    }
    return this.contactsService.findByUuid(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new contact' })
  async create(@Body() createContactDto: CreateContactDto) {
    return this.contactsService.create(createContactDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a contact' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateContactDto: UpdateContactDto,
  ) {
    return this.contactsService.update(id, updateContactDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a contact' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.contactsService.remove(id);
  }

  @Get(':id/orders')
  @ApiOperation({ summary: 'Get contact sales orders' })
  async getOrders(@Param('id') id: string) {
    const odooId = /^\d+$/.test(id)
      ? Number(id)
      : await this.contactsService.resolveUuid(id);
    if (!odooId) return [];
    return this.contactsService.getOrders(odooId);
  }

  @Get(':id/projects')
  @ApiOperation({ summary: 'Get contact projects' })
  async getProjects(@Param('id') id: string) {
    const odooId = /^\d+$/.test(id)
      ? Number(id)
      : await this.contactsService.resolveUuid(id);
    if (!odooId) return [];
    return this.contactsService.getProjects(odooId);
  }

  // --- Pets ---
  @Get(':id/pets')
  async getPets(@Param('id') id: string) {
    const odooId = /^\d+$/.test(id)
      ? Number(id)
      : await this.contactsService.resolveUuid(id);
    if (!odooId) return [];
    return this.contactsService.getPets(odooId);
  }

  @Post(':id/pets')
  async createPet(@Param('id') id: string, @Body() data: any) {
    const odooId = /^\d+$/.test(id)
      ? Number(id)
      : await this.contactsService.resolveUuid(id);
    if (!odooId) throw new Error('Contact not found');
    return this.contactsService.createPet(odooId, data);
  }

  @Put('pets/:petId')
  async updatePet(@Param('petId') petId: string, @Body() data: any) {
    return this.contactsService.updatePet(petId, data);
  }

  @Delete('pets/:petId')
  async removePet(@Param('petId') petId: string) {
    return this.contactsService.removePet(petId);
  }

  // --- Files ---
  @Get(':id/files')
  async getFiles(@Param('id') id: string) {
    const odooId = /^\d+$/.test(id)
      ? Number(id)
      : await this.contactsService.resolveUuid(id);
    if (!odooId) return [];
    return this.contactsService.getFiles(odooId);
  }

  @Post(':id/files')
  async createFile(@Param('id') id: string, @Body() data: any) {
    const odooId = /^\d+$/.test(id)
      ? Number(id)
      : await this.contactsService.resolveUuid(id);
    if (!odooId) throw new Error('Contact not found');
    return this.contactsService.createFile(odooId, data);
  }

  @Delete('files/:fileId')
  async removeFile(@Param('fileId') fileId: string) {
    return this.contactsService.removeFile(fileId);
  }

  // --- Tasks ---
  @Get(':id/tasks')
  async getTasks(@Param('id') id: string) {
    const odooId = /^\d+$/.test(id)
      ? Number(id)
      : await this.contactsService.resolveUuid(id);
    if (!odooId) return [];
    return this.contactsService.getTasks(odooId);
  }

  @Post(':id/tasks')
  async createTask(@Param('id') id: string, @Body() data: any) {
    const odooId = /^\d+$/.test(id)
      ? Number(id)
      : await this.contactsService.resolveUuid(id);
    if (!odooId) throw new Error('Contact not found');
    return this.contactsService.createTask(odooId, data);
  }

  @Put('tasks/:taskId')
  async updateTask(@Param('taskId') taskId: string, @Body() data: any) {
    return this.contactsService.updateTask(taskId, data);
  }

  @Delete('tasks/:taskId')
  async removeTask(@Param('taskId') taskId: string) {
    return this.contactsService.removeTask(taskId);
  }

  // --- Activities ---
  @Get(':id/activities')
  async getActivities(@Param('id') id: string) {
    const odooId = /^\d+$/.test(id)
      ? Number(id)
      : await this.contactsService.resolveUuid(id);
    if (!odooId) return [];
    return this.contactsService.getActivities(odooId);
  }

  @Post(':id/activities')
  async createActivity(@Param('id') id: string, @Body() data: any) {
    const odooId = /^\d+$/.test(id)
      ? Number(id)
      : await this.contactsService.resolveUuid(id);
    if (!odooId) throw new Error('Contact not found');
    return this.contactsService.createActivity(odooId, data);
  }

  @Put('activities/:activityId')
  async updateActivity(
    @Param('activityId') activityId: string,
    @Body() data: any,
  ) {
    return this.contactsService.updateActivity(activityId, data);
  }

  @Delete('activities/:activityId')
  async removeActivity(@Param('activityId') activityId: string) {
    return this.contactsService.removeActivity(activityId);
  }

  // --- Shifts ---
  @Get(':id/shifts')
  async getShifts(
    @Param('id') id: string,
    @Query() paginationDto: PaginationDto,
  ) {
    const odooId = /^\d+$/.test(id)
      ? Number(id)
      : await this.contactsService.resolveUuid(id);
    if (!odooId) return { data: [], total: 0 };
    const pageSize = Math.max(1, Math.min(100, Number(paginationDto.pageSize || 10)));
    const page = Math.max(1, Number(paginationDto.page || 1));
    return this.contactsService.getShifts(odooId, { ...paginationDto, pageSize, page });
  }

  @Post(':id/clock-in')
  async clockIn(@Param('id') id: string) {
    const odooId = /^\d+$/.test(id)
      ? Number(id)
      : await this.contactsService.resolveUuid(id);
    if (!odooId) throw new Error('Contact not found');
    return this.contactsService.clockIn(odooId);
  }

  @Post('shifts/:shiftId/clock-out')
  async clockOut(@Param('shiftId') shiftId: string) {
    return this.contactsService.clockOut(shiftId);
  }



  // --- Timeline & Notes ---
  @Get(':id/timeline')
  @ApiOperation({ summary: 'Get contact timeline (activities & messages)' })
  async getTimeline(@Param('id') id: string) {
    const odooId = /^\d+$/.test(id)
      ? Number(id)
      : await this.contactsService.resolveUuid(id);
    if (!odooId) return [];
    return this.contactsService.getTimeline(odooId);
  }

  @Post(':id/notes')
  @ApiOperation({ summary: 'Create a new note (Odoo message)' })
  async createNote(@Param('id') id: string, @Body('body') body: string) {
    const odooId = /^\d+$/.test(id)
      ? Number(id)
      : await this.contactsService.resolveUuid(id);
    if (!odooId) throw new Error('Contact not found');
    return this.contactsService.createNote(odooId, body);
  }
}
