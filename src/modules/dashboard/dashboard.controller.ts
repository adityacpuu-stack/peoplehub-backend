import { Request, Response } from 'express';
import { DashboardService } from './dashboard.service';
import { AuthUser } from '../../middlewares/auth.middleware';

const service = new DashboardService();

export class DashboardController {
  // ==========================================
  // MAIN DASHBOARD
  // ==========================================

  async getOverview(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const result = await service.getOverview(user);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }

  async getQuickStats(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const result = await service.getQuickStats(user);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }

  // ==========================================
  // INDIVIDUAL SUMMARIES
  // ==========================================

  async getEmployeeSummary(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const companyFilter = this.getCompanyFilter(user);
      const result = await service.getEmployeeSummary(companyFilter);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }

  async getAttendanceSummary(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const companyFilter = this.getCompanyFilter(user);
      const result = await service.getAttendanceSummary(companyFilter);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }

  async getLeaveSummary(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const companyFilter = this.getCompanyFilter(user);
      const result = await service.getLeaveSummary(companyFilter);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }

  async getPayrollSummary(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const companyFilter = this.getCompanyFilter(user);
      const result = await service.getPayrollSummary(companyFilter);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }

  async getPerformanceSummary(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const companyFilter = this.getCompanyFilter(user);
      const result = await service.getPerformanceSummary(companyFilter);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }

  async getAlerts(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const result = await service.getAlerts(user);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }

  // ==========================================
  // CALENDAR
  // ==========================================

  async getCalendarEvents(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const startDate = req.query.start_date
        ? new Date(req.query.start_date as string)
        : new Date();
      const endDate = req.query.end_date
        ? new Date(req.query.end_date as string)
        : new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);

      const result = await service.getCalendarEvents(user, startDate, endDate);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }

  // ==========================================
  // SELF-SERVICE DASHBOARDS
  // ==========================================

  async getMyDashboard(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const result = await service.getMyDashboard(user);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }

  async getTeamDashboard(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const result = await service.getTeamDashboard(user);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }

  // ==========================================
  // GROUP CEO DASHBOARD
  // ==========================================

  async getGroupOverview(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const result = await service.getGroupOverview(user);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }

  async getWorkforceAnalytics(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const companyId = req.query.company_id ? parseInt(req.query.company_id as string) : undefined;
      const result = await service.getWorkforceAnalytics(user, companyId);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }

  async getTurnoverAnalytics(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const companyId = req.query.company_id ? parseInt(req.query.company_id as string) : undefined;
      const period = req.query.period as string | undefined;
      const result = await service.getTurnoverAnalytics(user, companyId, period);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }

  async getHeadcountAnalytics(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const companyId = req.query.company_id ? parseInt(req.query.company_id as string) : undefined;
      const period = req.query.period as string | undefined;
      const result = await service.getHeadcountAnalytics(user, companyId, period);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }

  // ==========================================
  // HELPER
  // ==========================================

  private getCompanyFilter(user: AuthUser): any {
    if (user.roles.includes('Super Admin')) {
      return {};
    }
    if (user.accessibleCompanyIds.length > 0) {
      return { company_id: { in: user.accessibleCompanyIds } };
    }
    return { company_id: user.employee?.company_id };
  }
}
