import { Type } from 'class-transformer';
import {
  IsArray,
  IsTimeZone,
  IsBoolean,
  IsNumber,
  IsInt,
  Max,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { BookingAvailabilityDto } from './create-booking-type.dto.js';

export class UpdateBookingTypeDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1440)
  durationMinutes?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1440)
  bufferMinutes?: number;

  @IsOptional()
  @IsTimeZone()
  timeZone?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BookingAvailabilityDto)
  availabilities?: BookingAvailabilityDto[];
}
