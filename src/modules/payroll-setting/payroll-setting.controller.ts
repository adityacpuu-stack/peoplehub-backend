import { Request, Response } from 'express';
import { PayrollSettingService } from './payroll-setting.service';
import { AuthUser } from '../../middlewares/auth.middleware';

const payrollSettingService = new PayrollSettingService();

export class PayrollSettingController {
  // ==========================================
  // PAYROLL SETTING ENDPOINTS
  // ==========================================

  async getByCompany(req: Request, res: Response) {
    try {
      const companyId = parseInt(req.params.companyId as string);
      const result = await payrollSettingService.getByCompany(companyId);

      if (!result) {
        res.status(404).json({ error: 'Payroll setting not found for this company' });
        return;
      }

      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getOrCreate(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const companyId = parseInt(req.params.companyId as string);
      const result = await payrollSettingService.getOrCreate(companyId, user);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const result = await payrollSettingService.create(req.body, user);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const companyId = parseInt(req.params.companyId as string);
      const result = await payrollSettingService.update(companyId, req.body, user);
      res.json(result);
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  async upsert(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const companyId = parseInt(req.params.companyId as string);
      const result = await payrollSettingService.upsert(companyId, req.body, user);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async resetToDefault(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const companyId = parseInt(req.params.companyId as string);
      const result = await payrollSettingService.resetToDefault(companyId, user);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // ==========================================
  // TAX CONFIGURATION ENDPOINTS (TER)
  // ==========================================

  async listTaxConfigurations(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const query = {
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        tax_category: req.query.tax_category as string | undefined,
        is_active: req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined,
      };
      const result = await payrollSettingService.listTaxConfigurations(query, user);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getTaxConfigurationById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const result = await payrollSettingService.getTaxConfigurationById(id);
      res.json(result);
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  async createTaxConfiguration(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const result = await payrollSettingService.createTaxConfiguration(req.body, user);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateTaxConfiguration(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      const result = await payrollSettingService.updateTaxConfiguration(id, req.body, user);
      res.json(result);
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  async deleteTaxConfiguration(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      await payrollSettingService.deleteTaxConfiguration(id, user);
      res.json({ message: 'Tax configuration deleted successfully' });
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  async seedTerRates(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const result = await payrollSettingService.seedTerRates(user);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // ==========================================
  // TAX BRACKET ENDPOINTS (Progressive)
  // ==========================================

  async listTaxBrackets(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const query = {
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        company_id: req.query.company_id ? parseInt(req.query.company_id as string) : undefined,
        is_active: req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined,
      };
      const result = await payrollSettingService.listTaxBrackets(query, user);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getTaxBracketById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const result = await payrollSettingService.getTaxBracketById(id);
      res.json(result);
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  async createTaxBracket(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const result = await payrollSettingService.createTaxBracket(req.body, user);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateTaxBracket(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      const result = await payrollSettingService.updateTaxBracket(id, req.body, user);
      res.json(result);
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  async deleteTaxBracket(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      await payrollSettingService.deleteTaxBracket(id, user);
      res.json({ message: 'Tax bracket deleted successfully' });
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  async seedTaxBrackets(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const companyId = req.body.company_id ? parseInt(req.body.company_id) : null;
      const result = await payrollSettingService.seedTaxBrackets(companyId, user);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // ==========================================
  // PTKP ENDPOINTS
  // ==========================================

  async listPtkp(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const query = {
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        company_id: req.query.company_id ? parseInt(req.query.company_id as string) : undefined,
        is_active: req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined,
      };
      const result = await payrollSettingService.listPtkp(query, user);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getPtkpById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const result = await payrollSettingService.getPtkpById(id);
      res.json(result);
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  async getPtkpByStatus(req: Request, res: Response) {
    try {
      const status = req.params.status as string;
      const result = await payrollSettingService.getPtkpByStatus(status);

      if (!result) {
        res.status(404).json({ error: 'PTKP status not found' });
        return;
      }

      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async createPtkp(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const result = await payrollSettingService.createPtkp(req.body, user);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updatePtkp(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      const result = await payrollSettingService.updatePtkp(id, req.body, user);
      res.json(result);
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  async deletePtkp(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      await payrollSettingService.deletePtkp(id, user);
      res.json({ message: 'PTKP deleted successfully' });
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  async seedPtkp(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const companyId = req.body.company_id ? parseInt(req.body.company_id) : null;
      const result = await payrollSettingService.seedPtkp(companyId, user);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // ==========================================
  // UTILITY ENDPOINTS
  // ==========================================

  async getTerRate(req: Request, res: Response) {
    try {
      const monthlyIncome = parseFloat(req.query.income as string);
      const ptkpStatus = req.query.ptkp_status as string;

      if (isNaN(monthlyIncome) || !ptkpStatus) {
        res.status(400).json({ error: 'income and ptkp_status are required' });
        return;
      }

      const rate = await payrollSettingService.getTerRate(monthlyIncome, ptkpStatus);
      const category = await payrollSettingService.getTerCategory(ptkpStatus);

      res.json({
        monthly_income: monthlyIncome,
        ptkp_status: ptkpStatus,
        ter_category: category,
        ter_rate: rate,
        estimated_tax: monthlyIncome * rate,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async calculateProgressiveTax(req: Request, res: Response) {
    try {
      const yearlyIncome = parseFloat(req.query.income as string);
      const companyId = req.query.company_id ? parseInt(req.query.company_id as string) : undefined;

      if (isNaN(yearlyIncome)) {
        res.status(400).json({ error: 'income is required' });
        return;
      }

      const tax = await payrollSettingService.calculateProgressiveTax(yearlyIncome, companyId);

      res.json({
        yearly_taxable_income: yearlyIncome,
        yearly_tax: tax,
        monthly_tax: tax / 12,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async seedAllTaxData(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      if (!user || !user.id) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }
      const companyId = req.body.company_id ? parseInt(req.body.company_id) : null;
      const result = await payrollSettingService.seedAllTaxData(companyId, user);
      res.json(result);
    } catch (error: any) {
      console.error('Seed all tax data error:', error);
      res.status(400).json({ error: error.message });
    }
  }
}
