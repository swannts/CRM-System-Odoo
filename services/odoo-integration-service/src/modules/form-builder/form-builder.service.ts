import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service.js';

@Injectable()
export class FormBuilderService {
  private readonly logger = new Logger(FormBuilderService.name);

  constructor(private prisma: PrismaService) {}

  async listForms(orgId: string) {
    return this.prisma.form.findMany({
      where: { orgId },
      include: { website: true },
    });
  }

  async listTemplates() {
    // For now, return a static set of templates or empty
    return [
      { id: 'tpl-contact', name: 'Standard Contact Form', type: 'contact' },
      { id: 'tpl-reg', name: 'Event Registration', type: 'registration' },
    ];
  }

  async getForm(orgId: string, id: string) {
    return this.prisma.form.findFirst({
      where: { id, orgId },
    });
  }

  async createForm(orgId: string, data: any) {
    return this.prisma.form.create({
      data: {
        ...data,
        orgId,
      },
    });
  }
}
