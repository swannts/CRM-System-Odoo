import { BadRequestException } from '@nestjs/common';

export function parseOdooNumericId(value: string | number): number {
  const match = String(value).match(/\d+/);
  if (!match) throw new BadRequestException('Invalid numeric Odoo ID.');

  const id = Number(match[0]);
  if (!Number.isFinite(id) || id <= 0) {
    throw new BadRequestException('Invalid numeric Odoo ID.');
  }

  return id;
}
