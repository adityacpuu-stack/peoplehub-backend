import { Request, Response } from 'express';
import { WorkLocationService } from './work-location.service';
import { AuthUser } from '../../middlewares/auth.middleware';

const workLocationService = new WorkLocationService();

export class WorkLocationController {
  async list(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const result = await workLocationService.list(req.query, user);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      const result = await workLocationService.getById(id, user);
      res.json(result);
    } catch (error: any) {
      res.status(error.message === 'Work location not found' ? 404 : 400).json({ error: error.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const result = await workLocationService.create(req.body, user);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      const result = await workLocationService.update(id, req.body, user);
      res.json(result);
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      await workLocationService.delete(id, user);
      res.json({ message: 'Work location deleted successfully' });
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  async getByCompany(req: Request, res: Response) {
    try {
      const companyId = parseInt(req.params.companyId as string);
      const result = await workLocationService.getByCompany(companyId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getNearbyLocations(req: Request, res: Response) {
    try {
      const latitude = parseFloat(req.query.latitude as string);
      const longitude = parseFloat(req.query.longitude as string);
      const radiusKm = req.query.radius ? parseFloat(req.query.radius as string) : 10;

      if (isNaN(latitude) || isNaN(longitude)) {
        res.status(400).json({ error: 'Valid latitude and longitude are required' });
        return;
      }

      const result = await workLocationService.getNearbyLocations(latitude, longitude, radiusKm);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async checkLocationValidity(req: Request, res: Response) {
    try {
      const locationId = parseInt(req.params.id as string);
      const latitude = parseFloat(req.body.latitude);
      const longitude = parseFloat(req.body.longitude);

      if (isNaN(latitude) || isNaN(longitude)) {
        res.status(400).json({ error: 'Valid latitude and longitude are required' });
        return;
      }

      const result = await workLocationService.checkLocationValidity(locationId, latitude, longitude);
      res.json(result);
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }
}
