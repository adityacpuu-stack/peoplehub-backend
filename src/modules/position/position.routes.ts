import { Router } from 'express';
import * as positionController from './position.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireHRStaffOrHigher, requireManagerOrHigher } from '../../middlewares/role.middleware';
import { validateCompanyAccess, validateCompanyAccessFromQuery } from '../../middlewares/company.middleware';
import { validateBody, validateQuery } from '../../middlewares/validate.middleware';
import { createPositionSchema, updatePositionSchema, listPositionQuerySchema } from '../../validations/position.schema';

const router = Router();

router.use(authenticate);

router.get('/', requireManagerOrHigher, validateCompanyAccessFromQuery, validateQuery(listPositionQuerySchema), positionController.list);
router.get('/company/:companyId', requireManagerOrHigher, validateCompanyAccess, positionController.getByCompany);
router.get('/department/:departmentId', requireManagerOrHigher, positionController.getByDepartment);
router.get('/:id', requireManagerOrHigher, positionController.getById);
router.post('/', requireHRStaffOrHigher, validateBody(createPositionSchema), positionController.create);
router.put('/:id', requireHRStaffOrHigher, validateBody(updatePositionSchema), positionController.update);
router.delete('/:id', requireHRStaffOrHigher, positionController.remove);

export default router;
