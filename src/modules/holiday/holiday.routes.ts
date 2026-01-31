import { Router } from 'express';
import { HolidayController } from './holiday.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';

const router = Router();
const controller = new HolidayController();

// All routes require authentication
router.use(authenticate);

// List & Calendar
router.get('/', controller.list.bind(controller));
router.get('/calendar', controller.getCalendar.bind(controller));
router.get('/upcoming', controller.getUpcoming.bind(controller));

// Seed national holidays (Super Admin only)
router.post('/seed/:year', authorize(['Super Admin']), controller.seedNationalHolidays.bind(controller));

// Bulk create
router.post('/bulk', authorize(['Super Admin', 'HR Manager']), controller.bulkCreate.bind(controller));

// CRUD
router.get('/:id', controller.getById.bind(controller));
router.post('/', authorize(['Super Admin', 'HR Manager']), controller.create.bind(controller));
router.put('/:id', authorize(['Super Admin', 'HR Manager']), controller.update.bind(controller));
router.delete('/:id', authorize(['Super Admin', 'HR Manager']), controller.delete.bind(controller));

export default router;
