import { PrismaClient, Prisma } from '@prisma/client';
import {
  SalaryGradeListQuery,
  CreateSalaryGradeDTO,
  UpdateSalaryGradeDTO,
  SALARY_GRADE_SELECT,
  SALARY_GRADE_DETAIL_SELECT,
  DEFAULT_SALARY_GRADES,
} from './salary-grade.types';
import { AuthUser } from '../../middlewares/auth.middleware';

const prisma = new PrismaClient();

export class SalaryGradeService {
  async list(query: SalaryGradeListQuery, user: AuthUser) {
    const { page = 1, limit = 50, search, status, level } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.SalaryGradeWhereInput = {};

    if (search) {
      where.OR = [
        { grade_code: { contains: search } },
        { grade_name: { contains: search } },
      ];
    }

    if (status) where.status = status;
    if (level) where.level = level;

    const [data, total] = await Promise.all([
      prisma.salaryGrade.findMany({
        where,
        select: SALARY_GRADE_DETAIL_SELECT,
        skip,
        take: limit,
        orderBy: { level: 'asc' },
      }),
      prisma.salaryGrade.count({ where }),
    ]);

    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getById(id: number) {
    const grade = await prisma.salaryGrade.findUnique({
      where: { id },
      select: SALARY_GRADE_DETAIL_SELECT,
    });
    if (!grade) throw new Error('Salary grade not found');
    return grade;
  }

  async getByCode(code: string) {
    const grade = await prisma.salaryGrade.findUnique({
      where: { grade_code: code },
      select: SALARY_GRADE_DETAIL_SELECT,
    });
    if (!grade) throw new Error('Salary grade not found');
    return grade;
  }

  async create(data: CreateSalaryGradeDTO, user: AuthUser) {
    const existing = await prisma.salaryGrade.findUnique({ where: { grade_code: data.grade_code } });
    if (existing) throw new Error('Grade code already exists');

    // Calculate mid_salary if not provided
    if (!data.mid_salary && data.min_salary && data.max_salary) {
      data.mid_salary = (data.min_salary + data.max_salary) / 2;
    }

    return prisma.salaryGrade.create({
      data: { ...data, status: data.status || 'active' },
      select: SALARY_GRADE_DETAIL_SELECT,
    });
  }

  async update(id: number, data: UpdateSalaryGradeDTO, user: AuthUser) {
    const existing = await prisma.salaryGrade.findUnique({ where: { id } });
    if (!existing) throw new Error('Salary grade not found');

    // Recalculate mid_salary if min/max changed
    if ((data.min_salary || data.max_salary) && !data.mid_salary) {
      const min = data.min_salary ?? Number(existing.min_salary);
      const max = data.max_salary ?? Number(existing.max_salary);
      if (min && max) {
        data.mid_salary = (min + max) / 2;
      }
    }

    return prisma.salaryGrade.update({
      where: { id },
      data,
      select: SALARY_GRADE_DETAIL_SELECT,
    });
  }

  async delete(id: number, user: AuthUser) {
    const existing = await prisma.salaryGrade.findUnique({
      where: { id },
      include: { _count: { select: { employees: true } } },
    });

    if (!existing) throw new Error('Salary grade not found');
    if (existing._count.employees > 0) {
      throw new Error(`Cannot delete grade with ${existing._count.employees} employees assigned`);
    }

    return prisma.salaryGrade.delete({ where: { id } });
  }

  async seedDefaults(user: AuthUser) {
    const results = { created: 0, skipped: 0 };

    for (const grade of DEFAULT_SALARY_GRADES) {
      try {
        const existing = await prisma.salaryGrade.findUnique({ where: { grade_code: grade.grade_code } });
        if (existing) {
          results.skipped++;
          continue;
        }

        await prisma.salaryGrade.create({
          data: { ...grade, status: 'active' },
        });
        results.created++;
      } catch {
        results.skipped++;
      }
    }

    return results;
  }

  async getEmployeesByGrade(gradeId: number) {
    return prisma.employee.findMany({
      where: { salary_grade_id: gradeId },
      select: {
        id: true,
        employee_id: true,
        name: true,
        basic_salary: true,
        department: { select: { id: true, name: true } },
        position: { select: { id: true, name: true } },
      },
    });
  }

  async assignEmployeeToGrade(employeeId: number, gradeId: number, user: AuthUser) {
    const grade = await prisma.salaryGrade.findUnique({ where: { id: gradeId } });
    if (!grade) throw new Error('Salary grade not found');

    return prisma.employee.update({
      where: { id: employeeId },
      data: { salary_grade_id: gradeId },
      select: { id: true, employee_id: true, name: true, salary_grade_id: true },
    });
  }

  async getSalaryRangeAnalysis() {
    const grades = await prisma.salaryGrade.findMany({
      where: { status: 'active' },
      include: {
        employees: {
          select: { basic_salary: true },
        },
      },
      orderBy: { level: 'asc' },
    });

    return grades.map((grade) => {
      const salaries = grade.employees.map((e) => Number(e.basic_salary || 0)).filter((s) => s > 0);
      const avgSalary = salaries.length ? salaries.reduce((a, b) => a + b, 0) / salaries.length : 0;

      return {
        grade_code: grade.grade_code,
        grade_name: grade.grade_name,
        level: grade.level,
        min_salary: grade.min_salary,
        max_salary: grade.max_salary,
        mid_salary: grade.mid_salary,
        employee_count: grade.employees.length,
        avg_actual_salary: avgSalary,
        compa_ratio: grade.mid_salary ? avgSalary / Number(grade.mid_salary) : null,
      };
    });
  }
}
