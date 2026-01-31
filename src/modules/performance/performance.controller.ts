import { Request, Response } from 'express';
import { PerformanceService } from './performance.service';
import {
  PerformanceReviewListQuery,
  GoalListQuery,
  KPIListQuery,
  PerformanceCycleListQuery,
  CreatePerformanceReviewDTO,
  UpdatePerformanceReviewDTO,
  SubmitSelfAssessmentDTO,
  SubmitManagerReviewDTO,
  CreateGoalDTO,
  UpdateGoalDTO,
  UpdateGoalProgressDTO,
  ManagerFeedbackDTO,
  CreateKPIDTO,
  UpdateKPIDTO,
  CreatePerformanceCycleDTO,
  UpdatePerformanceCycleDTO,
  CreateFeedbackDTO,
} from './performance.types';

const performanceService = new PerformanceService();

const getParam = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) return param[0] || '';
  return param || '';
};

// ==========================================
// PERFORMANCE REVIEW CONTROLLERS
// ==========================================

export const listReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }

    const query: PerformanceReviewListQuery = {
      page: parseInt(getParam(req.query.page as string)) || 1,
      limit: parseInt(getParam(req.query.limit as string)) || 10,
      employee_id: req.query.employee_id ? parseInt(getParam(req.query.employee_id as string)) : undefined,
      reviewer_id: req.query.reviewer_id ? parseInt(getParam(req.query.reviewer_id as string)) : undefined,
      company_id: req.query.company_id ? parseInt(getParam(req.query.company_id as string)) : undefined,
      department_id: req.query.department_id ? parseInt(getParam(req.query.department_id as string)) : undefined,
      cycle_id: req.query.cycle_id ? parseInt(getParam(req.query.cycle_id as string)) : undefined,
      review_type: getParam(req.query.review_type as string) || undefined,
      status: getParam(req.query.status as string) || undefined,
      year: req.query.year ? parseInt(getParam(req.query.year as string)) : undefined,
    };

    const result = await performanceService.listReviews(query, req.user);
    res.status(200).json({ message: 'Reviews retrieved successfully', ...result });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getReviewById = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }
    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) { res.status(400).json({ message: 'Invalid review ID' }); return; }

    const review = await performanceService.getReviewById(id, req.user);
    res.status(200).json({ message: 'Review retrieved successfully', data: review });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : error.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const getMyReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }
    const result = await performanceService.getMyReviews({}, req.user);
    res.status(200).json({ message: 'Reviews retrieved successfully', ...result });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyCurrentReview = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }
    const review = await performanceService.getMyCurrentReview(req.user);
    res.status(200).json({ message: 'Current review retrieved successfully', data: review });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getTeamReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }
    const reviews = await performanceService.getTeamReviews(req.user);
    res.status(200).json({ message: 'Team reviews retrieved successfully', data: reviews });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createReview = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }
    const data: CreatePerformanceReviewDTO = req.body;
    if (!data.employee_id || !data.review_type) {
      res.status(400).json({ message: 'Employee ID and review type are required' }); return;
    }
    const review = await performanceService.createReview(data, req.user);
    res.status(201).json({ message: 'Review created successfully', data: review });
  } catch (error: any) {
    const status = error.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const updateReview = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }
    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) { res.status(400).json({ message: 'Invalid review ID' }); return; }
    const data: UpdatePerformanceReviewDTO = req.body;
    const review = await performanceService.updateReview(id, data, req.user);
    res.status(200).json({ message: 'Review updated successfully', data: review });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : error.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const submitSelfAssessment = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }
    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) { res.status(400).json({ message: 'Invalid review ID' }); return; }
    const data: SubmitSelfAssessmentDTO = req.body;
    const review = await performanceService.submitSelfAssessment(id, data, req.user);
    res.status(200).json({ message: 'Self-assessment submitted successfully', data: review });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : error.message.includes('Only') ? 403 : error.message.includes('Cannot') ? 400 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const submitManagerReview = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }
    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) { res.status(400).json({ message: 'Invalid review ID' }); return; }
    const data: SubmitManagerReviewDTO = req.body;
    if (!data.overall_rating || !data.manager_comments) {
      res.status(400).json({ message: 'Overall rating and manager comments are required' }); return;
    }
    const review = await performanceService.submitManagerReview(id, data, req.user);
    res.status(200).json({ message: 'Manager review submitted successfully', data: review });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : error.message.includes('Not authorized') ? 403 : error.message.includes('not ready') ? 400 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const completeReview = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }
    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) { res.status(400).json({ message: 'Invalid review ID' }); return; }
    const review = await performanceService.completeReview(id, req.user);
    res.status(200).json({ message: 'Review completed successfully', data: review });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : error.message.includes('Only HR') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};

// ==========================================
// GOAL CONTROLLERS
// ==========================================

export const listGoals = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }
    const query: GoalListQuery = {
      page: parseInt(getParam(req.query.page as string)) || 1,
      limit: parseInt(getParam(req.query.limit as string)) || 10,
      employee_id: req.query.employee_id ? parseInt(getParam(req.query.employee_id as string)) : undefined,
      category: getParam(req.query.category as string) || undefined,
      status: getParam(req.query.status as string) || undefined,
      priority: getParam(req.query.priority as string) || undefined,
      year: req.query.year ? parseInt(getParam(req.query.year as string)) : undefined,
    };
    const result = await performanceService.listGoals(query, req.user);
    res.status(200).json({ message: 'Goals retrieved successfully', ...result });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getGoalById = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }
    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) { res.status(400).json({ message: 'Invalid goal ID' }); return; }
    const goal = await performanceService.getGoalById(id, req.user);
    res.status(200).json({ message: 'Goal retrieved successfully', data: goal });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : error.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const getMyGoals = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }
    const result = await performanceService.getMyGoals({}, req.user);
    res.status(200).json({ message: 'Goals retrieved successfully', ...result });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createGoal = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }
    const data: CreateGoalDTO = req.body;
    if (!data.employee_id || !data.title) {
      res.status(400).json({ message: 'Employee ID and title are required' }); return;
    }
    const goal = await performanceService.createGoal(data, req.user);
    res.status(201).json({ message: 'Goal created successfully', data: goal });
  } catch (error: any) {
    const status = error.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const updateGoal = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }
    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) { res.status(400).json({ message: 'Invalid goal ID' }); return; }
    const data: UpdateGoalDTO = req.body;
    const goal = await performanceService.updateGoal(id, data, req.user);
    res.status(200).json({ message: 'Goal updated successfully', data: goal });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : error.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const updateGoalProgress = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }
    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) { res.status(400).json({ message: 'Invalid goal ID' }); return; }
    const data: UpdateGoalProgressDTO = req.body;
    if (data.progress_percentage === undefined) {
      res.status(400).json({ message: 'Progress percentage is required' }); return;
    }
    const goal = await performanceService.updateGoalProgress(id, data, req.user);
    res.status(200).json({ message: 'Goal progress updated successfully', data: goal });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : error.message.includes('Only') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const addManagerFeedback = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }
    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) { res.status(400).json({ message: 'Invalid goal ID' }); return; }
    const data: ManagerFeedbackDTO = req.body;
    if (!data.manager_feedback) {
      res.status(400).json({ message: 'Manager feedback is required' }); return;
    }
    const goal = await performanceService.addManagerFeedback(id, data, req.user);
    res.status(200).json({ message: 'Feedback added successfully', data: goal });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : error.message.includes('Only') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const deleteGoal = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }
    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) { res.status(400).json({ message: 'Invalid goal ID' }); return; }
    await performanceService.deleteGoal(id, req.user);
    res.status(200).json({ message: 'Goal deleted successfully' });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : error.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};

// ==========================================
// KPI CONTROLLERS
// ==========================================

export const listKPIs = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }
    const query: KPIListQuery = {
      page: parseInt(getParam(req.query.page as string)) || 1,
      limit: parseInt(getParam(req.query.limit as string)) || 50,
      department_id: req.query.department_id ? parseInt(getParam(req.query.department_id as string)) : undefined,
      position_id: req.query.position_id ? parseInt(getParam(req.query.position_id as string)) : undefined,
      category: getParam(req.query.category as string) || undefined,
      is_active: req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined,
    };
    const result = await performanceService.listKPIs(query, req.user);
    res.status(200).json({ message: 'KPIs retrieved successfully', ...result });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getKPIById = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }
    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) { res.status(400).json({ message: 'Invalid KPI ID' }); return; }
    const kpi = await performanceService.getKPIById(id);
    res.status(200).json({ message: 'KPI retrieved successfully', data: kpi });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const createKPI = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }
    const data: CreateKPIDTO = req.body;
    if (!data.name) { res.status(400).json({ message: 'Name is required' }); return; }
    const kpi = await performanceService.createKPI(data, req.user);
    res.status(201).json({ message: 'KPI created successfully', data: kpi });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateKPI = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }
    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) { res.status(400).json({ message: 'Invalid KPI ID' }); return; }
    const data: UpdateKPIDTO = req.body;
    const kpi = await performanceService.updateKPI(id, data, req.user);
    res.status(200).json({ message: 'KPI updated successfully', data: kpi });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const deleteKPI = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }
    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) { res.status(400).json({ message: 'Invalid KPI ID' }); return; }
    await performanceService.deleteKPI(id, req.user);
    res.status(200).json({ message: 'KPI deleted successfully' });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : 500;
    res.status(status).json({ message: error.message });
  }
};

// ==========================================
// PERFORMANCE CYCLE CONTROLLERS
// ==========================================

export const listCycles = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }
    const query: PerformanceCycleListQuery = {
      page: parseInt(getParam(req.query.page as string)) || 1,
      limit: parseInt(getParam(req.query.limit as string)) || 10,
      year: req.query.year ? parseInt(getParam(req.query.year as string)) : undefined,
      status: getParam(req.query.status as string) || undefined,
    };
    const result = await performanceService.listCycles(query, req.user);
    res.status(200).json({ message: 'Cycles retrieved successfully', ...result });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getCycleById = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }
    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) { res.status(400).json({ message: 'Invalid cycle ID' }); return; }
    const cycle = await performanceService.getCycleById(id);
    res.status(200).json({ message: 'Cycle retrieved successfully', data: cycle });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const getActiveCycle = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }
    const cycle = await performanceService.getActiveCycle();
    res.status(200).json({ message: 'Active cycle retrieved successfully', data: cycle });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createCycle = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }
    const data: CreatePerformanceCycleDTO = req.body;
    if (!data.name || !data.year || !data.start_date || !data.end_date) {
      res.status(400).json({ message: 'Name, year, start date, and end date are required' }); return;
    }
    const cycle = await performanceService.createCycle(data, req.user);
    res.status(201).json({ message: 'Cycle created successfully', data: cycle });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateCycle = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }
    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) { res.status(400).json({ message: 'Invalid cycle ID' }); return; }
    const data: UpdatePerformanceCycleDTO = req.body;
    const cycle = await performanceService.updateCycle(id, data, req.user);
    res.status(200).json({ message: 'Cycle updated successfully', data: cycle });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const activateCycle = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }
    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) { res.status(400).json({ message: 'Invalid cycle ID' }); return; }
    const cycle = await performanceService.activateCycle(id, req.user);
    res.status(200).json({ message: 'Cycle activated successfully', data: cycle });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// FEEDBACK CONTROLLERS
// ==========================================

export const createFeedback = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }
    const data: CreateFeedbackDTO = req.body;
    if (!data.employee_id) { res.status(400).json({ message: 'Employee ID is required' }); return; }
    const feedback = await performanceService.createFeedback(data, req.user);
    res.status(201).json({ message: 'Feedback submitted successfully', data: feedback });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getFeedbackForReview = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }
    const reviewId = parseInt(getParam(req.params.reviewId));
    if (isNaN(reviewId)) { res.status(400).json({ message: 'Invalid review ID' }); return; }
    const feedback = await performanceService.getFeedbackForReview(reviewId, req.user);
    res.status(200).json({ message: 'Feedback retrieved successfully', data: feedback });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : error.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};
