import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  MaxLength,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateAppointmentDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  guestName?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  guestEmail?: string;

  @IsString()
  bookingTypeId!: string;

  @IsDateString()
  startTime!: string;

  @IsOptional()
  @IsString()
  contactId?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsIn(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'])
  status?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  odooEventId?: number;
}
