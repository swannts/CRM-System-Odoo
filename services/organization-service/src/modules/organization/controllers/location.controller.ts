import { Response } from 'express';
import { LocationService } from '../services/organization.service.js';
import { AuthenticatedRequest } from '../../../common/interfaces/authenticated-request.js';

export class LocationController {
  private svc = new LocationService();

  async list(req: AuthenticatedRequest, res: Response) {
    try {
      const locations = await this.svc.getLocations(req.identity.orgId, req.identity.userId);
      return res.json({ data: locations });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async create(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.body.name) return res.status(400).json({ message: 'Name is required' });
      const location = await this.svc.createLocation(req.identity.orgId, req.identity.userId, req.body);
      return res.status(201).json({ data: location });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async update(req: AuthenticatedRequest, res: Response) {
    try {
      const locationId = String(req.params.locationId || '').trim();
      if (!locationId) return res.status(400).json({ message: 'locationId is required' });
      const location = await this.svc.updateLocation(
        req.identity.orgId,
        req.identity.userId,
        locationId,
        req.body || {}
      );
      return res.json({ data: location });
    } catch (err: any) {
      if (err.message === 'Location not found') return res.status(404).json({ message: err.message });
      return res.status(500).json({ message: err.message });
    }
  }

  async remove(req: AuthenticatedRequest, res: Response) {
    try {
      const locationId = String(req.params.locationId || '').trim();
      if (!locationId) return res.status(400).json({ message: 'locationId is required' });
      const data = await this.svc.removeLocation(req.identity.orgId, req.identity.userId, locationId);
      return res.json({ data });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }
}
