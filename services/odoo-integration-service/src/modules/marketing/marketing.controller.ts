import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Query,
  Param,
  ParseIntPipe,
  UseGuards,
  BadRequestException,
  NotImplementedException,
  Headers,
  Req,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { MarketingService } from './marketing.service.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { IdentityGuard } from '../../common/guards/identity.guard.js';
import { CurrentUser } from '../../common/decorators/user.decorator.js';
import type { Identity } from '../../common/interfaces/identity.interface.js';
import { createHmac } from 'crypto';

@ApiTags('Marketing')
@UseGuards(IdentityGuard)
@ApiHeader({ name: 'x-user-id', required: true })
@ApiHeader({ name: 'x-org-id', required: true })
@Controller('marketing')
export class MarketingController {
  constructor(private readonly marketingService: MarketingService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get marketing summary dashboard stats' })
  async getSummary() {
    const stats = await this.marketingService.analytics();
    return {
      totalContacts: stats.totalLeads,
      activeCampaigns: stats.activeCampaigns,
      scheduledCampaigns: 0,
      sentCampaigns: stats.totalCampaigns - stats.activeCampaigns,
      openRate: undefined,
      clickRate: undefined,
      conversionRate: stats.conversionRate,
      channelHealth: 'healthy',
    };
  }

  @Get('activity')
  @ApiOperation({ summary: 'Get recent marketing activity' })
  async getActivity() {
    return this.marketingService.getActivity();
  }

  // --- Campaigns (UTM) ---

  @Get('campaigns')
  @ApiOperation({ summary: 'List all marketing campaigns' })
  async listCampaigns(@Query() paginationDto: PaginationDto) {
    const result = await this.marketingService.listCampaigns(paginationDto);
    return {
      ...result,
      data: result.data.map((c: any) => ({
        id: String(c.id),
        name: c.name,
        type: 'email',
        status: c.active
          ? 'active'
          : Number(c?.color ?? -1) === 8
            ? 'archived'
            : 'paused',
        active: c.active !== false,
        color: c?.color,
        title: c?.title,
        createdAt: c.create_date,
        updatedAt: c.write_date,
      })),
    };
  }

  @Post('campaigns')
  @ApiOperation({ summary: 'Create a new campaign' })
  async createCampaign(@Body() data: any) {
    return this.marketingService.createCampaign(data);
  }

  @Get('campaigns/:id')
  @ApiOperation({ summary: 'Get a specific campaign' })
  async getCampaign(@Param('id', ParseIntPipe) id: number) {
    const c = await this.marketingService.getCampaign(id);
    if (!c) return null;
    return {
      id: String(c.id),
      name: c.name,
      type: 'email',
      status: c.active
        ? 'active'
        : Number(c?.color ?? -1) === 8
          ? 'archived'
          : 'paused',
      active: c.active !== false,
      color: c?.color,
      title: c?.title,
      createdAt: c.create_date,
      updatedAt: c.write_date,
    };
  }

  @Patch('campaigns/:id')
  @ApiOperation({ summary: 'Update a campaign' })
  async updateCampaign(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: any,
  ) {
    return this.marketingService.updateCampaign(id, data);
  }

  @Put('campaigns/:id')
  @ApiOperation({ summary: 'Update a campaign (PUT alias)' })
  async updateCampaignPut(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: any,
  ) {
    return this.marketingService.updateCampaign(id, data);
  }

  @Delete('campaigns/:id')
  @ApiOperation({ summary: 'Delete a campaign' })
  async removeCampaign(@Param('id', ParseIntPipe) id: number) {
    return this.marketingService.removeCampaign(id);
  }

  @Post('campaigns/:id/launch')
  @ApiOperation({ summary: 'Set campaign status to active' })
  async launchCampaign(@Param('id', ParseIntPipe) id: number) {
    return this.marketingService.setCampaignStatus(id, 'launch');
  }

  @Post('campaigns/:id/pause')
  @ApiOperation({ summary: 'Set campaign status to paused' })
  async pauseCampaign(@Param('id', ParseIntPipe) id: number) {
    return this.marketingService.setCampaignStatus(id, 'pause');
  }

  @Post('campaigns/:id/archive')
  @ApiOperation({ summary: 'Archive campaign (soft)' })
  async archiveCampaign(@Param('id', ParseIntPipe) id: number) {
    return this.marketingService.setCampaignStatus(id, 'archive');
  }

  // --- Mailing Actions ---

  @Post('campaigns/:id/send')
  @ApiOperation({ summary: 'Send campaign mailing' })
  async sendCampaign(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-org-id') orgId?: string,
  ) {
    const mailings = await this.marketingService.listMailings(id);
    if (mailings.length === 0)
      throw new BadRequestException(
        'Campaign content is missing. Save builder content first.',
      );
    const mailing = mailings[0];
    if (!mailing?.subject || !mailing?.body_html) {
      throw new BadRequestException(
        'Campaign content is incomplete. Subject and content are required.',
      );
    }
    if (!mailing?.contact_list_ids || mailing.contact_list_ids.length === 0) {
      throw new BadRequestException('Audience is required before sending.');
    }
    const senderConfigured = await this.marketingService.isSenderConfigured();
    if (!senderConfigured.configured)
      throw new NotImplementedException(
        senderConfigured.message || 'Marketing sender is not configured.',
      );
    const compliance = await this.marketingService.getComplianceStatus(
      id,
      orgId,
    );
    if (!compliance.available)
      throw new NotImplementedException(
        compliance.message || 'Compliance checks are not available yet.',
      );
    if ((compliance.compliantRecipients || 0) <= 0) {
      throw new BadRequestException(
        'No compliant recipients available for delivery.',
      );
    }
    return this.marketingService.sendMailing(mailing.id);
  }

  @Post('campaigns/:id/schedule')
  @ApiOperation({ summary: 'Schedule campaign mailing' })
  async scheduleCampaign(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { time?: string; scheduledAt?: string },
    @Headers('x-org-id') orgId?: string,
  ) {
    const scheduleAt = body?.scheduledAt || body?.time;
    if (!scheduleAt) throw new BadRequestException('scheduledAt is required.');
    const scheduled = new Date(scheduleAt);
    if (
      Number.isNaN(scheduled.getTime()) ||
      scheduled.getTime() <= Date.now()
    ) {
      throw new BadRequestException(
        'scheduledAt must be a valid future datetime.',
      );
    }
    const mailings = await this.marketingService.listMailings(id);
    if (mailings.length === 0)
      throw new BadRequestException(
        'Campaign content is missing. Save builder content first.',
      );
    const mailing = mailings[0];
    if (!mailing?.subject || !mailing?.body_html) {
      throw new BadRequestException(
        'Campaign content is incomplete. Subject and content are required.',
      );
    }
    if (!mailing?.contact_list_ids || mailing.contact_list_ids.length === 0) {
      throw new BadRequestException('Audience is required before scheduling.');
    }
    const senderConfigured = await this.marketingService.isSenderConfigured();
    if (!senderConfigured.configured)
      throw new NotImplementedException(
        senderConfigured.message || 'Marketing sender is not configured.',
      );
    const compliance = await this.marketingService.getComplianceStatus(
      id,
      orgId,
    );
    if (!compliance.available)
      throw new NotImplementedException(
        compliance.message || 'Compliance checks are not available yet.',
      );
    if ((compliance.compliantRecipients || 0) <= 0) {
      throw new BadRequestException(
        'No compliant recipients available for delivery.',
      );
    }
    await this.marketingService.scheduleMailing(mailing.id, scheduleAt);
    return this.getCampaign(id);
  }

  @Post('campaigns/:id/send-test')
  async sendTest(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { email?: string; to?: string },
  ) {
    const recipient = String(body?.to || body?.email || '').trim();
    if (!recipient) throw new BadRequestException('Recipient is required.');
    const campaign = await this.marketingService.getCampaign(id);
    if (!campaign) throw new BadRequestException('Campaign not found.');
    const senderConfigured = await this.marketingService.isSenderConfigured();
    if (!senderConfigured.configured) {
      throw new NotImplementedException(
        senderConfigured.message || 'Marketing sender is not configured.',
      );
    }
    try {
      return await this.marketingService.sendTestMail(id, recipient);
    } catch (error: any) {
      throw new BadRequestException(
        error?.message || 'Unable to send test campaign.',
      );
    }
  }

  @Post('campaigns/:id/cancel-schedule')
  async cancelSchedule(@Param('id', ParseIntPipe) id: number) {
    const mailings = await this.marketingService.listMailings(id);
    if (mailings.length === 0)
      throw new BadRequestException(
        'No scheduled mailing found for this campaign.',
      );
    await this.marketingService.cancelScheduledMailing(mailings[0].id);
    return this.getCampaign(id);
  }

  @Patch('campaigns/:id/content')
  async updateCampaignContent(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: any,
    @CurrentUser() user: Identity,
  ) {
    const campaign = await this.marketingService.updateCampaignContent(
      id,
      data,
      { orgId: user.orgId, userId: user.userId },
    );
    return campaign;
  }

  // --- Segments (Mailing Lists) ---

  @Get('segments')
  @ApiOperation({ summary: 'List all marketing segments' })
  async listSegments() {
    const segments = await this.marketingService.listSegments();
    return segments.map((s: any) => ({
      id: String(s.id),
      name: s.name,
      contactCount: s.contact_count ?? s.contact_nbr ?? 0, // Dynamic mapping based on Odoo version
      type: 'static',
      createdAt: s.create_date || new Date().toISOString(),
      updatedAt: s.write_date || new Date().toISOString(),
    }));
  }

  @Get('segments/:id')
  async getSegment(@Param('id', ParseIntPipe) id: number) {
    const s = await this.marketingService.getSegment(id);
    if (!s) return null;
    return {
      id: String(s.id),
      name: s.name,
      contactCount: s.contact_count ?? s.contact_nbr ?? 0,
      type: 'static',
      createdAt: s.create_date,
      updatedAt: s.write_date,
    };
  }

  @Post('segments')
  async createSegment(@Body() data: any) {
    return this.marketingService.createSegment(data);
  }

  @Patch('segments/:id')
  async updateSegment(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: any,
  ) {
    return this.marketingService.updateSegment(id, data);
  }

  @Delete('segments/:id')
  async deleteSegment(@Param('id', ParseIntPipe) id: number) {
    return this.marketingService.deleteSegment(id);
  }

  @Post('segments/preview')
  async previewSegment(@Body() payload: any) {
    const segmentId = Number(payload?.segmentId);
    if (Number.isFinite(segmentId) && segmentId > 0) {
      const result = await this.marketingService.previewSegmentById(segmentId);
      if (result?.available === false)
        throw new NotImplementedException(
          'Segment preview is not available yet.',
        );
      return result;
    }
    if (!Array.isArray(payload?.filters)) {
      throw new BadRequestException('filters must be an array.');
    }
    try {
      return await this.marketingService.previewSegment(payload?.filters);
    } catch (error: any) {
      throw new BadRequestException(
        error?.message || 'Invalid segment filters.',
      );
    }
  }

  // --- Templates ---

  @Get('templates')
  @ApiOperation({ summary: 'List all marketing templates' })
  async listTemplates() {
    const templates = await this.marketingService.listTemplates();
    return templates.map((t: any) => ({
      id: String(t.id),
      name: t.name,
      subject: t.subject,
      content: t.body_html,
      category: 'newsletter',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  }

  @Get('templates/:id')
  async getTemplate(@Param('id', ParseIntPipe) id: number) {
    const t = await this.marketingService.getTemplate(id);
    if (!t) return null;
    return {
      id: String(t.id),
      name: t.name,
      subject: t.subject,
      content: t.body_html,
      category: 'newsletter',
    };
  }

  @Post('templates')
  async createTemplate(@Body() data: any) {
    return this.marketingService.createTemplate(data);
  }

  @Patch('templates/:id')
  async updateTemplate(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: any,
  ) {
    return this.marketingService.updateTemplate(id, data);
  }

  @Delete('templates/:id')
  async deleteTemplate(@Param('id', ParseIntPipe) id: number) {
    return this.marketingService.deleteTemplate(id);
  }

  @Post('templates/:id/duplicate')
  async duplicateTemplate(@Param('id', ParseIntPipe) id: number) {
    return this.marketingService.duplicateTemplate(id);
  }

  @Get('templates/:id/usage')
  async templateUsage(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-org-id') orgId?: string,
  ) {
    if (!orgId)
      throw new UnauthorizedException('Missing organization context.');
    try {
      return await this.marketingService.getTemplateUsage(orgId, String(id));
    } catch (error) {
      throw new NotImplementedException(
        'Template usage tracking is not available yet.',
      );
    }
  }

  // --- Sources & Mediums ---

  @Get('sources')
  async listSources(@Query() paginationDto: PaginationDto) {
    return this.marketingService.listSources(paginationDto);
  }

  @Post('sources')
  async createSource(@Body() data: any) {
    return this.marketingService.createSource(data);
  }

  @Put('sources/:id')
  async updateSource(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    return this.marketingService.updateSource(id, data);
  }

  @Delete('sources/:id')
  async deleteSource(@Param('id', ParseIntPipe) id: number) {
    return this.marketingService.deleteSource(id);
  }

  @Get('mediums')
  async listMediums(@Query() paginationDto: PaginationDto) {
    return this.marketingService.listMediums(paginationDto);
  }

  @Post('mediums')
  async createMedium(@Body() data: any) {
    return this.marketingService.createMedium(data);
  }

  @Put('mediums/:id')
  async updateMedium(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    return this.marketingService.updateMedium(id, data);
  }

  @Delete('mediums/:id')
  async deleteMedium(@Param('id', ParseIntPipe) id: number) {
    return this.marketingService.deleteMedium(id);
  }

  @Get('analytics')
  async getAnalytics(@Query() filters?: any) {
    return this.marketingService.analytics(filters);
  }

  @Get('campaigns/:id/analytics')
  async getCampaignAnalytics(
    @Param('id', ParseIntPipe) id: number,
    @Query() _paginationDto: PaginationDto,
    @Headers('x-org-id') orgId?: string,
  ) {
    if (orgId)
      return this.marketingService.campaignEventAnalytics(orgId, String(id));
    return this.marketingService.campaignDeliveryAnalytics(id);
  }

  @Get('campaigns/:id/insights')
  async getCampaignInsights(
    @Param('id', ParseIntPipe) id: number,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.marketingService.campaignInsights(id, paginationDto);
  }

  @Get('campaigns/:id/compliance-status')
  async getCampaignComplianceStatus(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-org-id') orgId?: string,
  ) {
    const result = await this.marketingService.getComplianceStatus(id, orgId);
    if (!result.available)
      throw new NotImplementedException(
        result.message || 'Compliance checks are not available yet.',
      );
    return result;
  }

  @Get('sender-status')
  async getSenderStatus() {
    const result = await this.marketingService.isSenderConfigured();
    if (!result.configured)
      throw new NotImplementedException(
        result.message || 'Sender configuration is required.',
      );
    return result;
  }

  @Get('campaigns/:id/template-usage')
  async campaignTemplateUsage(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-org-id') orgId?: string,
  ) {
    if (!orgId)
      throw new UnauthorizedException('Missing organization context.');
    try {
      return await this.marketingService.getCampaignTemplateUsage(
        orgId,
        String(id),
      );
    } catch (error) {
      throw new NotImplementedException(
        'Template usage tracking is not available yet.',
      );
    }
  }

  @Get('campaigns/:id/delivery-events')
  async campaignDeliveryEvents(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-org-id') orgId?: string,
  ) {
    if (!orgId)
      throw new UnauthorizedException('Missing organization context.');
    try {
      return await this.marketingService.getDeliveryEvents(orgId, String(id));
    } catch (error) {
      throw new NotImplementedException(
        'Delivery event tracking is not available yet.',
      );
    }
  }

  @Get('suppression-list')
  async suppressionList(@Headers('x-org-id') orgId?: string) {
    if (!orgId)
      throw new UnauthorizedException('Missing organization context.');
    try {
      return await this.marketingService.getSuppressionList(orgId);
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new NotImplementedException(
        'Suppression list storage is not available yet.',
      );
    }
  }

  @Post('suppression-list')
  async addSuppression(
    @Headers('x-org-id') orgId?: string,
    @Body() payload?: any,
  ) {
    if (!orgId)
      throw new UnauthorizedException('Missing organization context.');
    try {
      return await this.marketingService.addSuppressionEntry(orgId, payload);
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      if (
        error?.message?.startsWith?.('Invalid') ||
        error?.message?.includes?.('required')
      ) {
        throw new BadRequestException(error.message);
      }
      throw new NotImplementedException(
        'Suppression list storage is not available yet.',
      );
    }
  }

  @Delete('suppression-list/:id')
  async removeSuppression(
    @Headers('x-org-id') orgId?: string,
    @Param('id') id?: string,
  ) {
    if (!orgId)
      throw new UnauthorizedException('Missing organization context.');
    try {
      return await this.marketingService.removeSuppressionEntry(
        orgId,
        String(id),
      );
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new NotImplementedException(
        'Suppression list storage is not available yet.',
      );
    }
  }

  @Post('contacts/:id/consent')
  async upsertConsent(
    @CurrentUser() user: Identity,
    @Param('id') contactId?: string,
    @Body() payload?: any,
  ) {
    try {
      return await this.marketingService.upsertContactConsent(
        user.orgId,
        String(contactId),
        payload,
        user.userId,
      );
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new NotImplementedException(
        'Consent policy storage is not available yet.',
      );
    }
  }

  @Post('webhooks/:provider')
  @HttpCode(HttpStatus.ACCEPTED)
  async ingestWebhook(
    @Param('provider') provider: string,
    @Headers('x-org-id') orgId?: string,
    @Headers('x-webhook-signature') signature?: string,
    @Req() req?: any,
  ) {
    const configuredProviders = String(
      process.env.MARKETING_WEBHOOK_PROVIDERS || '',
    )
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
    if (!configuredProviders.includes(provider)) {
      throw new NotImplementedException('Webhook provider is not configured.');
    }
    const secret = process.env.MARKETING_WEBHOOK_SECRET;
    if (!secret) {
      throw new NotImplementedException(
        'Webhook signature configuration is missing.',
      );
    }
    if (!signature)
      throw new UnauthorizedException('Missing webhook signature.');

    // NOTE: raw body middleware is not enabled in this service yet; we verify against JSON payload text.
    const rawBody = req?.rawBody
      ? Buffer.isBuffer(req.rawBody)
        ? req.rawBody
        : Buffer.from(String(req.rawBody))
      : Buffer.from(JSON.stringify(req?.body || {}));
    const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
    if (signature !== expected)
      throw new UnauthorizedException('Invalid webhook signature.');

    if (!orgId)
      throw new UnauthorizedException('Missing organization context.');
    const payload = req?.body || {};
    const eventType = String(payload?.eventType || '').toLowerCase();
    const campaignId = String(payload?.campaignId || '');
    if (!campaignId || !eventType)
      throw new BadRequestException('campaignId and eventType are required.');

    try {
      await this.marketingService.ingestDeliveryEvent(orgId, provider, {
        campaignId,
        eventType,
        providerEventId: payload?.providerEventId,
        providerMessageId: payload?.providerMessageId,
        recipientId: payload?.recipientId,
        recipientEmail: payload?.recipientEmail,
        recipientPhone: payload?.recipientPhone,
        url: payload?.url,
        reason: payload?.reason,
        occurredAt: payload?.occurredAt,
        rawPayload: payload,
      });
    } catch (error) {
      throw new NotImplementedException(
        'Delivery event storage is not available yet.',
      );
    }

    return { accepted: true };
  }
}
