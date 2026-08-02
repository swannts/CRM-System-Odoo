import { Module } from '@nestjs/common';
import { FormBuilderController } from './form-builder.controller.js';
import { FormBuilderService } from './form-builder.service.js';
import { PrismaService } from '../../database/prisma/prisma.service.js';

@Module({
  controllers: [FormBuilderController],
  providers: [FormBuilderService, PrismaService],
  exports: [FormBuilderService],
})
export class FormBuilderModule {}
