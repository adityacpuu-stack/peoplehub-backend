import { Router } from 'express';
import * as performanceController from './performance.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireHRStaffOrHigher, requireManagerOrHigher } from '../../middlewares/role.middleware';

const router = Router();

router.use(authenticate);

// ==========================================
// SELF-SERVICE ROUTES
// ==========================================

router.get('/reviews/me', performanceController.getMyReviews);
router.get('/reviews/me/current', performanceController.getMyCurrentReview);
router.get('/goals/me', performanceController.getMyGoals);

// Submit self-assessment
router.post('/reviews/:id/self-assessment', performanceController.submitSelfAssessment);

// Update own goal progress
router.post('/goals/:id/progress', performanceController.updateGoalProgress);

// ==========================================
// MANAGER ROUTES
// ==========================================

router.get('/reviews/team', requireManagerOrHigher, performanceController.getTeamReviews);
router.post('/reviews/:id/manager-review', requireManagerOrHigher, performanceController.submitManagerReview);
router.post('/goals/:id/feedback', requireManagerOrHigher, performanceController.addManagerFeedback);

// ==========================================
// PERFORMANCE CYCLE ROUTES
// ==========================================

router.get('/cycles', performanceController.listCycles);
router.get('/cycles/active', performanceController.getActiveCycle);
router.get('/cycles/:id', performanceController.getCycleById);
router.post('/cycles', requireHRStaffOrHigher, performanceController.createCycle);
router.put('/cycles/:id', requireHRStaffOrHigher, performanceController.updateCycle);
router.post('/cycles/:id/activate', requireHRStaffOrHigher, performanceController.activateCycle);

// ==========================================
// KPI ROUTES
// ==========================================

router.get('/kpis', performanceController.listKPIs);
router.get('/kpis/:id', performanceController.getKPIById);
router.post('/kpis', requireHRStaffOrHigher, performanceController.createKPI);
router.put('/kpis/:id', requireHRStaffOrHigher, performanceController.updateKPI);
router.delete('/kpis/:id', requireHRStaffOrHigher, performanceController.deleteKPI);

// ==========================================
// PERFORMANCE REVIEW ROUTES
// ==========================================

router.get('/reviews', requireManagerOrHigher, performanceController.listReviews);
router.get('/reviews/:id', performanceController.getReviewById);
router.post('/reviews', requireHRStaffOrHigher, performanceController.createReview);
router.put('/reviews/:id', requireHRStaffOrHigher, performanceController.updateReview);
router.post('/reviews/:id/complete', requireHRStaffOrHigher, performanceController.completeReview);

// ==========================================
// GOAL ROUTES
// ==========================================

router.get('/goals', requireManagerOrHigher, performanceController.listGoals);
router.get('/goals/:id', performanceController.getGoalById);
router.post('/goals', performanceController.createGoal);
router.put('/goals/:id', performanceController.updateGoal);
router.delete('/goals/:id', performanceController.deleteGoal);

// ==========================================
// FEEDBACK ROUTES
// ==========================================

router.post('/feedback', performanceController.createFeedback);
router.get('/reviews/:reviewId/feedback', performanceController.getFeedbackForReview);

export default router;
