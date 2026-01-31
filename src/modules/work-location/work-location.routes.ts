import { Router } from 'express';
import { WorkLocationController } from './work-location.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';

const router = Router();
const workLocationController = new WorkLocationController();

// All routes require authentication
router.use(authenticate);

// GET /api/v1/work-locations - List all work locations
router.get('/', authorize(['Super Admin', 'HR Manager', 'HR Staff']), (req, res) => workLocationController.list(req, res));

// GET /api/v1/work-locations/nearby - Get nearby locations
router.get('/nearby', (req, res) => workLocationController.getNearbyLocations(req, res));

// GET /api/v1/work-locations/company/:companyId - Get by company
router.get('/company/:companyId', authorize(['Super Admin', 'HR Manager', 'HR Staff']), (req, res) => workLocationController.getByCompany(req, res));

// GET /api/v1/work-locations/:id - Get by ID
router.get('/:id', authorize(['Super Admin', 'HR Manager', 'HR Staff']), (req, res) => workLocationController.getById(req, res));

// POST /api/v1/work-locations/:id/check-validity - Check location validity
router.post('/:id/check-validity', (req, res) => workLocationController.checkLocationValidity(req, res));

// POST /api/v1/work-locations - Create work location
router.post('/', authorize(['Super Admin', 'HR Manager']), (req, res) => workLocationController.create(req, res));

// PUT /api/v1/work-locations/:id - Update work location
router.put('/:id', authorize(['Super Admin', 'HR Manager']), (req, res) => workLocationController.update(req, res));

// DELETE /api/v1/work-locations/:id - Delete work location
router.delete('/:id', authorize(['Super Admin', 'HR Manager']), (req, res) => workLocationController.delete(req, res));

export default router;
