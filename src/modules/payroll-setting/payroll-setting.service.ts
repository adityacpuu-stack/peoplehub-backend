import { PrismaClient, Prisma } from '@prisma/client';
import {
  PayrollSettingQuery,
  TaxConfigurationListQuery,
  TaxBracketListQuery,
  PtkpListQuery,
  CreatePayrollSettingDTO,
  UpdatePayrollSettingDTO,
  CreateTaxConfigurationDTO,
  UpdateTaxConfigurationDTO,
  CreateTaxBracketDTO,
  UpdateTaxBracketDTO,
  CreatePtkpDTO,
  UpdatePtkpDTO,
  PAYROLL_SETTING_SELECT,
  PAYROLL_SETTING_DETAIL_SELECT,
  TAX_CONFIGURATION_SELECT,
  TAX_BRACKET_SELECT,
  PTKP_SELECT,
  DEFAULT_PAYROLL_SETTINGS,
  DEFAULT_TAX_BRACKETS,
  DEFAULT_PTKP_VALUES,
  DEFAULT_TER_RATES,
  PTKP_TO_TER_CATEGORY,
} from './payroll-setting.types';
import { AuthUser } from '../../middlewares/auth.middleware';

const prisma = new PrismaClient();

export class PayrollSettingService {
  // ==========================================
  // PAYROLL SETTING METHODS
  // ==========================================

  async getByCompany(companyId: number) {
    return prisma.payrollSetting.findUnique({
      where: { company_id: companyId },
      select: PAYROLL_SETTING_DETAIL_SELECT,
    });
  }

  async getOrCreate(companyId: number, user: AuthUser) {
    let setting = await prisma.payrollSetting.findUnique({
      where: { company_id: companyId },
      select: PAYROLL_SETTING_DETAIL_SELECT,
    });

    if (!setting) {
      setting = await this.create({
        company_id: companyId,
        ...DEFAULT_PAYROLL_SETTINGS,
      }, user);
    }

    return setting;
  }

  async create(data: CreatePayrollSettingDTO, user: AuthUser) {
    const existing = await prisma.payrollSetting.findUnique({
      where: { company_id: data.company_id },
    });

    if (existing) {
      throw new Error('Payroll setting already exists for this company');
    }

    return prisma.payrollSetting.create({
      data,
      select: PAYROLL_SETTING_DETAIL_SELECT,
    });
  }

  async update(companyId: number, data: UpdatePayrollSettingDTO, user: AuthUser) {
    const existing = await prisma.payrollSetting.findUnique({
      where: { company_id: companyId },
    });

    if (!existing) {
      throw new Error('Payroll setting not found');
    }

    return prisma.payrollSetting.update({
      where: { company_id: companyId },
      data,
      select: PAYROLL_SETTING_DETAIL_SELECT,
    });
  }

  async upsert(companyId: number, data: UpdatePayrollSettingDTO, user: AuthUser) {
    const existing = await prisma.payrollSetting.findUnique({
      where: { company_id: companyId },
    });

    if (existing) {
      return this.update(companyId, data, user);
    } else {
      return this.create({ company_id: companyId, ...data } as CreatePayrollSettingDTO, user);
    }
  }

  async resetToDefault(companyId: number, user: AuthUser) {
    return this.upsert(companyId, DEFAULT_PAYROLL_SETTINGS, user);
  }

  // ==========================================
  // TAX CONFIGURATION METHODS (TER Rates)
  // ==========================================

  async listTaxConfigurations(query: TaxConfigurationListQuery, user: AuthUser) {
    const { page = 1, limit = 100, tax_category, is_active } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.TaxConfigurationWhereInput = {};

    if (tax_category) {
      where.tax_category = tax_category;
    }

    if (is_active !== undefined) {
      where.is_active = is_active;
    }

    const [data, total] = await Promise.all([
      prisma.taxConfiguration.findMany({
        where,
        select: TAX_CONFIGURATION_SELECT,
        skip,
        take: limit,
        orderBy: [{ tax_category: 'asc' }, { min_income: 'asc' }],
      }),
      prisma.taxConfiguration.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTaxConfigurationById(id: number) {
    const config = await prisma.taxConfiguration.findUnique({
      where: { id },
      select: TAX_CONFIGURATION_SELECT,
    });

    if (!config) {
      throw new Error('Tax configuration not found');
    }

    return config;
  }

  async createTaxConfiguration(data: CreateTaxConfigurationDTO, user: AuthUser) {
    return prisma.taxConfiguration.create({
      data,
      select: TAX_CONFIGURATION_SELECT,
    });
  }

  async updateTaxConfiguration(id: number, data: UpdateTaxConfigurationDTO, user: AuthUser) {
    const existing = await prisma.taxConfiguration.findUnique({ where: { id } });

    if (!existing) {
      throw new Error('Tax configuration not found');
    }

    return prisma.taxConfiguration.update({
      where: { id },
      data,
      select: TAX_CONFIGURATION_SELECT,
    });
  }

  async deleteTaxConfiguration(id: number, user: AuthUser) {
    const existing = await prisma.taxConfiguration.findUnique({ where: { id } });

    if (!existing) {
      throw new Error('Tax configuration not found');
    }

    return prisma.taxConfiguration.delete({ where: { id } });
  }

  async seedTerRates(user: AuthUser) {
    const results = { created: 0, skipped: 0 };

    for (const [category, rates] of Object.entries(DEFAULT_TER_RATES)) {
      for (const rate of rates) {
        try {
          const existing = await prisma.taxConfiguration.findFirst({
            where: {
              tax_category: category,
              min_income: rate.min,
            },
          });

          if (existing) {
            results.skipped++;
            continue;
          }

          await prisma.taxConfiguration.create({
            data: {
              tax_category: category,
              description: `${category} - ${rate.min} to ${rate.max || 'unlimited'}`,
              min_income: rate.min,
              max_income: rate.max,
              tax_rate: rate.rate,
              is_active: true,
            },
          });
          results.created++;
        } catch (error) {
          results.skipped++;
        }
      }
    }

    return results;
  }

  // ==========================================
  // TAX BRACKET METHODS (Progressive)
  // ==========================================

  async listTaxBrackets(query: TaxBracketListQuery, user: AuthUser) {
    const { page = 1, limit = 50, company_id, is_active } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.TaxBracketWhereInput = {};

    if (company_id) {
      where.OR = [
        { company_id: company_id },
        { company_id: null },
      ];
    }

    if (is_active !== undefined) {
      where.is_active = is_active;
    }

    const [data, total] = await Promise.all([
      prisma.taxBracket.findMany({
        where,
        select: TAX_BRACKET_SELECT,
        skip,
        take: limit,
        orderBy: { min_income: 'asc' },
      }),
      prisma.taxBracket.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTaxBracketById(id: number) {
    const bracket = await prisma.taxBracket.findUnique({
      where: { id },
      select: TAX_BRACKET_SELECT,
    });

    if (!bracket) {
      throw new Error('Tax bracket not found');
    }

    return bracket;
  }

  async createTaxBracket(data: CreateTaxBracketDTO, user: AuthUser) {
    return prisma.taxBracket.create({
      data: {
        ...data,
        created_by: user.id,
      },
      select: TAX_BRACKET_SELECT,
    });
  }

  async updateTaxBracket(id: number, data: UpdateTaxBracketDTO, user: AuthUser) {
    const existing = await prisma.taxBracket.findUnique({ where: { id } });

    if (!existing) {
      throw new Error('Tax bracket not found');
    }

    return prisma.taxBracket.update({
      where: { id },
      data,
      select: TAX_BRACKET_SELECT,
    });
  }

  async deleteTaxBracket(id: number, user: AuthUser) {
    const existing = await prisma.taxBracket.findUnique({ where: { id } });

    if (!existing) {
      throw new Error('Tax bracket not found');
    }

    return prisma.taxBracket.delete({ where: { id } });
  }

  async seedTaxBrackets(companyId: number | null, user: AuthUser) {
    const results = { created: 0, skipped: 0 };

    for (const bracket of DEFAULT_TAX_BRACKETS) {
      try {
        const existing = await prisma.taxBracket.findFirst({
          where: {
            bracket_name: bracket.bracket_name,
            company_id: companyId,
          },
        });

        if (existing) {
          results.skipped++;
          continue;
        }

        await prisma.taxBracket.create({
          data: {
            ...bracket,
            company_id: companyId,
            created_by: user.id,
          },
        });
        results.created++;
      } catch (error) {
        results.skipped++;
      }
    }

    return results;
  }

  // ==========================================
  // PTKP METHODS
  // ==========================================

  async listPtkp(query: PtkpListQuery, user: AuthUser) {
    const { page = 1, limit = 50, company_id, is_active } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PTKPWhereInput = {};

    if (company_id) {
      where.OR = [
        { company_id: company_id },
        { company_id: null },
      ];
    }

    if (is_active !== undefined) {
      where.is_active = is_active;
    }

    const [data, total] = await Promise.all([
      prisma.pTKP.findMany({
        where,
        select: PTKP_SELECT,
        skip,
        take: limit,
        orderBy: { status: 'asc' },
      }),
      prisma.pTKP.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPtkpById(id: number) {
    const ptkp = await prisma.pTKP.findUnique({
      where: { id },
      select: PTKP_SELECT,
    });

    if (!ptkp) {
      throw new Error('PTKP not found');
    }

    return ptkp;
  }

  async getPtkpByStatus(status: string) {
    const ptkp = await prisma.pTKP.findUnique({
      where: { status },
      select: PTKP_SELECT,
    });

    return ptkp;
  }

  async createPtkp(data: CreatePtkpDTO, user: AuthUser) {
    const existing = await prisma.pTKP.findUnique({
      where: { status: data.status },
    });

    if (existing) {
      throw new Error('PTKP status already exists');
    }

    return prisma.pTKP.create({
      data: {
        ...data,
        created_by: user.id,
      },
      select: PTKP_SELECT,
    });
  }

  async updatePtkp(id: number, data: UpdatePtkpDTO, user: AuthUser) {
    const existing = await prisma.pTKP.findUnique({ where: { id } });

    if (!existing) {
      throw new Error('PTKP not found');
    }

    return prisma.pTKP.update({
      where: { id },
      data,
      select: PTKP_SELECT,
    });
  }

  async deletePtkp(id: number, user: AuthUser) {
    const existing = await prisma.pTKP.findUnique({ where: { id } });

    if (!existing) {
      throw new Error('PTKP not found');
    }

    return prisma.pTKP.delete({ where: { id } });
  }

  async seedPtkp(companyId: number | null, user: AuthUser) {
    const results = { created: 0, skipped: 0 };

    for (const ptkp of DEFAULT_PTKP_VALUES) {
      try {
        const existing = await prisma.pTKP.findUnique({
          where: { status: ptkp.status },
        });

        if (existing) {
          results.skipped++;
          continue;
        }

        await prisma.pTKP.create({
          data: {
            ...ptkp,
            company_id: companyId,
            created_by: user.id,
          },
        });
        results.created++;
      } catch (error) {
        results.skipped++;
      }
    }

    return results;
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  async getTerCategory(ptkpStatus: string): Promise<string> {
    return PTKP_TO_TER_CATEGORY[ptkpStatus] || 'TER_A';
  }

  async getTerRate(monthlyIncome: number, ptkpStatus: string): Promise<number> {
    const category = await this.getTerCategory(ptkpStatus);

    const config = await prisma.taxConfiguration.findFirst({
      where: {
        tax_category: category,
        is_active: true,
        min_income: { lte: monthlyIncome },
        OR: [
          { max_income: { gte: monthlyIncome } },
          { max_income: null },
        ],
      },
      orderBy: { min_income: 'desc' },
    });

    return config ? Number(config.tax_rate) : 0;
  }

  async calculateProgressiveTax(yearlyTaxableIncome: number, companyId?: number): Promise<number> {
    const brackets = await prisma.taxBracket.findMany({
      where: {
        is_active: true,
        OR: companyId ? [
          { company_id: companyId },
          { company_id: null },
        ] : [
          { company_id: null },
        ],
      },
      orderBy: { min_income: 'asc' },
    });

    let totalTax = 0;
    let remainingIncome = yearlyTaxableIncome;

    for (const bracket of brackets) {
      if (remainingIncome <= 0) break;

      const minIncome = Number(bracket.min_income);
      const maxIncome = bracket.max_income ? Number(bracket.max_income) : Infinity;
      const rate = Number(bracket.rate);

      if (yearlyTaxableIncome > minIncome) {
        const taxableInBracket = Math.min(
          remainingIncome,
          maxIncome - minIncome
        );
        totalTax += taxableInBracket * rate;
        remainingIncome -= taxableInBracket;
      }
    }

    return totalTax;
  }

  async seedAllTaxData(companyId: number | null, user: AuthUser) {
    const results = {
      ter_rates: await this.seedTerRates(user),
      tax_brackets: await this.seedTaxBrackets(companyId, user),
      ptkp: await this.seedPtkp(companyId, user),
    };

    return results;
  }
}
