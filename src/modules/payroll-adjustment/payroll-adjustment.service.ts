import { PrismaClient, Prisma } from '@prisma/client';
import {
  PayrollAdjustmentListQuery,
  CreatePayrollAdjustmentDTO,
  UpdatePayrollAdjustmentDTO,
  BulkCreateAdjustmentDTO,
  PAYROLL_ADJUSTMENT_SELECT,
  PAYROLL_ADJUSTMENT_DETAIL_SELECT,
} from './payroll-adjustment.types';
import { AuthUser } from '../../middlewares/auth.middleware';

const prisma = new PrismaClient();

export class PayrollAdjustmentService {
  async list(query: PayrollAdjustmentListQuery, user: AuthUser) {
    const { page = 1, limit = 20, search, employee_id, company_id, type, status, pay_period, effective_from, effective_to, is_recurring } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PayrollAdjustmentWhereInput = {};

    if (company_id) {
      where.company_id = company_id;
    } else if (user.accessibleCompanyIds?.length) {
      where.company_id = { in: user.accessibleCompanyIds };
    }

    if (search) {
      where.OR = [
        { description: { contains: search } },
        { reference_number: { contains: search } },
        { employee: { name: { contains: search } } },
        { employee: { employee_id: { contains: search } } },
      ];
    }

    if (employee_id) where.employee_id = employee_id;
    if (type) where.type = type;
    if (status) where.status = status;
    if (pay_period) where.pay_period = pay_period;
    if (is_recurring !== undefined) where.is_recurring = is_recurring;
    if (effective_from || effective_to) {
      where.effective_date = {};
      if (effective_from) where.effective_date.gte = new Date(effective_from);
      if (effective_to) where.effective_date.lte = new Date(effective_to);
    }

    const [data, total] = await Promise.all([
      prisma.payrollAdjustment.findMany({
        where,
        select: PAYROLL_ADJUSTMENT_DETAIL_SELECT,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      prisma.payrollAdjustment.count({ where }),
    ]);

    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getById(id: number) {
    const adjustment = await prisma.payrollAdjustment.findUnique({
      where: { id },
      select: PAYROLL_ADJUSTMENT_DETAIL_SELECT,
    });
    if (!adjustment) throw new Error('Payroll adjustment not found');
    return adjustment;
  }

  async getByEmployeeId(employeeId: number, query: { status?: string; type?: string } = {}) {
    const where: Prisma.PayrollAdjustmentWhereInput = { employee_id: employeeId };
    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;

    return prisma.payrollAdjustment.findMany({
      where,
      select: PAYROLL_ADJUSTMENT_DETAIL_SELECT,
      orderBy: { created_at: 'desc' },
    });
  }

  async create(data: CreatePayrollAdjustmentDTO, user: AuthUser) {
    const employee = await prisma.employee.findUnique({
      where: { id: data.employee_id },
      select: { id: true, company_id: true },
    });

    if (!employee) throw new Error('Employee not found');

    const isLoanType = data.type === 'loan' || data.type === 'advance';
    let loanFields: Record<string, any> = {};

    if (isLoanType && data.total_loan_amount && data.installment_amount) {
      const totalInstallments = Math.ceil(data.total_loan_amount / data.installment_amount);
      loanFields = {
        total_loan_amount: data.total_loan_amount,
        installment_amount: data.installment_amount,
        total_installments: totalInstallments,
        current_installment: 0,
        remaining_balance: data.total_loan_amount,
      };
      // Override amount with installment amount
      data.amount = data.installment_amount;
      // Auto-enable recurring monthly
      data.is_recurring = true;
      data.recurring_frequency = 'monthly';
      // Auto-calculate recurring end date if effective_date is set
      if (data.effective_date) {
        const endDate = new Date(data.effective_date);
        endDate.setMonth(endDate.getMonth() + totalInstallments);
        data.recurring_end_date = endDate;
      }
    }

    // Remove loan-specific DTO fields that are not direct Prisma columns
    const { total_loan_amount, installment_amount, ...restData } = data;

    return prisma.payrollAdjustment.create({
      data: {
        ...restData,
        ...loanFields,
        effective_date: restData.effective_date ? new Date(restData.effective_date) : undefined,
        recurring_end_date: restData.recurring_end_date ? new Date(restData.recurring_end_date as any) : undefined,
        company_id: restData.company_id || employee.company_id,
        status: 'pending',
        created_by: user.id,
      },
      select: PAYROLL_ADJUSTMENT_DETAIL_SELECT,
    });
  }

  async update(id: number, data: UpdatePayrollAdjustmentDTO & { total_loan_amount?: number; installment_amount?: number }, user: AuthUser) {
    const existing = await prisma.payrollAdjustment.findUnique({ where: { id } });
    if (!existing) throw new Error('Payroll adjustment not found');
    if (existing.status === 'processed') throw new Error('Cannot update processed adjustment');

    // Strip fields that Prisma can't accept directly in update
    const { total_loan_amount, installment_amount, employee_id, ...restData } = data as any;

    const isLoanType = (restData.type || existing.type) === 'loan' || (restData.type || existing.type) === 'advance';
    let loanFields: Record<string, any> = {};

    if (isLoanType && total_loan_amount && installment_amount) {
      const totalInstallments = Math.ceil(total_loan_amount / installment_amount);
      loanFields = {
        total_loan_amount,
        installment_amount,
        total_installments: totalInstallments,
        current_installment: existing.current_installment || 0,
        remaining_balance: total_loan_amount - ((existing.current_installment || 0) * installment_amount),
      };
      restData.amount = installment_amount;
      restData.is_recurring = true;
      restData.recurring_frequency = 'monthly';
      if (restData.effective_date) {
        const endDate = new Date(restData.effective_date);
        endDate.setMonth(endDate.getMonth() + totalInstallments);
        restData.recurring_end_date = endDate as any;
      }
    }

    const updateData = {
      ...restData,
      ...loanFields,
      effective_date: restData.effective_date ? new Date(restData.effective_date) : undefined,
      recurring_end_date: restData.recurring_end_date ? new Date(restData.recurring_end_date as any) : undefined,
    };

    return prisma.payrollAdjustment.update({
      where: { id },
      data: updateData,
      select: PAYROLL_ADJUSTMENT_DETAIL_SELECT,
    });
  }

  async delete(id: number, user: AuthUser) {
    const existing = await prisma.payrollAdjustment.findUnique({ where: { id } });
    if (!existing) throw new Error('Payroll adjustment not found');
    if (existing.status === 'processed') throw new Error('Cannot delete processed adjustment');

    return prisma.payrollAdjustment.delete({ where: { id } });
  }

  async approve(id: number, user: AuthUser) {
    const adjustment = await prisma.payrollAdjustment.findUnique({ where: { id } });
    if (!adjustment) throw new Error('Payroll adjustment not found');
    if (adjustment.status !== 'pending') throw new Error('Only pending adjustments can be approved');

    const updateData: Record<string, any> = {
      status: 'approved',
      approved_by: user.id,
      approved_at: new Date(),
    };

    // Track installment progress for loan/advance types
    if (
      (adjustment.type === 'loan' || adjustment.type === 'advance') &&
      adjustment.total_loan_amount &&
      adjustment.installment_amount
    ) {
      const newInstallment = (adjustment.current_installment || 0) + 1;
      const installmentAmt = Number(adjustment.installment_amount);
      const totalLoan = Number(adjustment.total_loan_amount);
      const newBalance = Math.max(0, totalLoan - newInstallment * installmentAmt);

      updateData.current_installment = newInstallment;
      updateData.remaining_balance = newBalance;
    }

    return prisma.payrollAdjustment.update({
      where: { id },
      data: updateData,
      select: PAYROLL_ADJUSTMENT_DETAIL_SELECT,
    });
  }

  async isLoanFullyPaid(id: number): Promise<boolean> {
    const adjustment = await prisma.payrollAdjustment.findUnique({ where: { id } });
    if (!adjustment) throw new Error('Payroll adjustment not found');
    if (adjustment.type !== 'loan' && adjustment.type !== 'advance') return false;
    if (!adjustment.total_installments) return false;
    return (adjustment.current_installment || 0) >= adjustment.total_installments;
  }

  async reject(id: number, reason: string, user: AuthUser) {
    const adjustment = await prisma.payrollAdjustment.findUnique({ where: { id } });
    if (!adjustment) throw new Error('Payroll adjustment not found');
    if (adjustment.status !== 'pending') throw new Error('Only pending adjustments can be rejected');

    return prisma.payrollAdjustment.update({
      where: { id },
      data: { status: 'rejected', rejection_reason: reason, approved_by: user.id, approved_at: new Date() },
      select: PAYROLL_ADJUSTMENT_DETAIL_SELECT,
    });
  }

  async bulkCreate(data: BulkCreateAdjustmentDTO, user: AuthUser) {
    const { employee_ids, ...adjustmentData } = data;
    const results = { created: 0, failed: 0, errors: [] as string[] };

    for (const employeeId of employee_ids) {
      try {
        const employee = await prisma.employee.findUnique({
          where: { id: employeeId },
          select: { id: true, company_id: true },
        });

        if (!employee) {
          results.failed++;
          results.errors.push(`Employee ID ${employeeId} not found`);
          continue;
        }

        await prisma.payrollAdjustment.create({
          data: {
            ...adjustmentData,
            employee_id: employeeId,
            company_id: employee.company_id,
            status: 'pending',
            created_by: user.id,
          },
        });
        results.created++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Employee ${employeeId}: ${error.message}`);
      }
    }

    return results;
  }

  async bulkApprove(ids: number[], user: AuthUser) {
    const result = await prisma.payrollAdjustment.updateMany({
      where: { id: { in: ids }, status: 'pending' },
      data: { status: 'approved', approved_by: user.id, approved_at: new Date() },
    });
    return { approved: result.count };
  }

  async getPendingApprovals(companyId?: number) {
    const where: Prisma.PayrollAdjustmentWhereInput = { status: 'pending' };
    if (companyId) where.company_id = companyId;

    return prisma.payrollAdjustment.findMany({
      where,
      select: PAYROLL_ADJUSTMENT_DETAIL_SELECT,
      orderBy: { created_at: 'asc' },
    });
  }

  async getForPayroll(employeeId: number, payPeriod: string) {
    return prisma.payrollAdjustment.findMany({
      where: {
        employee_id: employeeId,
        status: 'approved',
        OR: [{ pay_period: payPeriod }, { is_recurring: true }],
      },
      select: PAYROLL_ADJUSTMENT_SELECT,
    });
  }

  async markAsProcessed(ids: number[]) {
    return prisma.payrollAdjustment.updateMany({
      where: { id: { in: ids }, status: 'approved' },
      data: { status: 'processed' },
    });
  }

  async getStatistics(query: { company_id?: number; pay_period?: string }, user: AuthUser) {
    const where: Prisma.PayrollAdjustmentWhereInput = {};
    if (query.company_id) where.company_id = query.company_id;
    if (query.pay_period) where.pay_period = query.pay_period;

    const [byType, byStatus, totals] = await Promise.all([
      prisma.payrollAdjustment.groupBy({
        by: ['type'],
        where,
        _count: true,
        _sum: { amount: true },
      }),
      prisma.payrollAdjustment.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      prisma.payrollAdjustment.aggregate({
        where,
        _count: true,
        _sum: { amount: true },
      }),
    ]);

    return {
      total_adjustments: totals._count,
      total_amount: totals._sum.amount,
      by_type: byType.map((t) => ({ type: t.type, count: t._count, amount: t._sum.amount })),
      by_status: byStatus.map((s) => ({ status: s.status, count: s._count })),
    };
  }
}
