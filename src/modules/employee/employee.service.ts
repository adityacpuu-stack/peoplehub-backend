import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import {
  EmployeeListQuery,
  CreateEmployeeDTO,
  UpdateEmployeeDTO,
  PaginatedResponse,
  EMPLOYEE_LIST_SELECT,
  EMPLOYEE_DETAIL_SELECT,
} from './employee.types';
import { EmployeeExportService, EMPLOYEE_EXPORT_SELECT } from './employee-export.service';
import { AuthUser } from '../../types/auth.types';

// Company order for employee_id sorting
const COMPANY_ORDER = ['PFI', 'GDI', 'LFS', 'UOR', 'BCI', 'PDR'];

// Hidden system accounts (Super Admin, etc.) - excluded from all listings
const HIDDEN_EMPLOYEE_IDS = ['EMP-001'];

export class EmployeeService {
  /**
   * Get paginated list of employees with filters
   */
  async list(
    query: EmployeeListQuery,
    user: AuthUser
  ): Promise<PaginatedResponse<any>> {
    const {
      page = 1,
      limit = 10,
      search,
      company_id,
      department_id,
      position_id,
      employment_status,
      employment_type,
      sort_by = 'employee_id',
      sort_order = 'asc',
    } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.EmployeeWhereInput = {
      // Exclude hidden system accounts from listing
      employee_id: { notIn: HIDDEN_EMPLOYEE_IDS },
      // Company scoping based on user access
      ...(user.roles.includes('Super Admin')
        ? {}
        : { company_id: { in: user.accessibleCompanyIds } }),
    };

    // Apply filters
    if (company_id) {
      where.company_id = company_id;
    }

    if (department_id) {
      where.department_id = department_id;
    }

    if (position_id) {
      where.position_id = position_id;
    }

    // Default to active employees unless explicitly requesting inactive or all
    if (employment_status === 'inactive') {
      // 'inactive' means all non-active statuses (inactive, terminated, resigned, retired)
      where.employment_status = { not: 'active' };
    } else if (employment_status === 'all') {
      // Show all employees (no filter)
    } else {
      // Default to active employees
      where.employment_status = 'active';
    }

    if (employment_type) {
      where.employment_type = employment_type;
    }

    // Search by name, employee_id, or email
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { employee_id: { contains: search } },
        { email: { contains: search } },
        { mobile_number: { contains: search } },
      ];
    }

    // Get total count
    const total = await prisma.employee.count({ where });

    // For employee_id sorting with company order, use custom sorting
    let employees: any[];

    if (sort_by === 'employee_id') {
      // Fetch all employees that match the filter
      const allEmployees = await prisma.employee.findMany({
        where,
        select: EMPLOYEE_LIST_SELECT,
      });

      // Sort by company order then by employee_id
      employees = allEmployees.sort((a, b) => {
        const aCompanyCode = this.extractCompanyCode(a.employee_id);
        const bCompanyCode = this.extractCompanyCode(b.employee_id);

        const aOrder = COMPANY_ORDER.indexOf(aCompanyCode);
        const bOrder = COMPANY_ORDER.indexOf(bCompanyCode);

        // If company code not found, put at end
        const aIndex = aOrder === -1 ? COMPANY_ORDER.length : aOrder;
        const bIndex = bOrder === -1 ? COMPANY_ORDER.length : bOrder;

        // First compare by company order
        if (aIndex !== bIndex) {
          return sort_order === 'asc' ? aIndex - bIndex : bIndex - aIndex;
        }

        // Then compare by employee_id (which includes year and sequence)
        const comparison = (a.employee_id || '').localeCompare(b.employee_id || '');
        return sort_order === 'asc' ? comparison : -comparison;
      });

      // Apply pagination after sorting
      employees = employees.slice(skip, skip + limit);
    } else {
      // Use standard Prisma sorting for other fields
      const orderBy: Prisma.EmployeeOrderByWithRelationInput = {
        [sort_by]: sort_order,
      };

      employees = await prisma.employee.findMany({
        where,
        select: EMPLOYEE_LIST_SELECT,
        skip,
        take: limit,
        orderBy,
      });
    }

    return {
      data: employees,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Extract company code from employee_id
   * Format: PFI-{COMPANY_CODE}-YYNNNNN (e.g., PFI-GDI-2500006 -> GDI)
   */
  private extractCompanyCode(employeeId: string | null): string {
    if (!employeeId) return '';
    const parts = employeeId.toUpperCase().split('-');
    // Format: PFI-GDI-2500006 -> parts[1] is company code
    if (parts.length >= 3) {
      return parts[1];
    }
    // Fallback: PFI-2500006 -> parts[0] is company code
    if (parts.length >= 2) {
      return parts[0];
    }
    return '';
  }

  /**
   * Get employee by ID
   */
  async getById(id: number, user: AuthUser): Promise<any> {
    const employee = await prisma.employee.findUnique({
      where: { id },
      select: EMPLOYEE_DETAIL_SELECT,
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    // Check company access
    if (
      !user.roles.includes('Super Admin') &&
      employee.company?.id &&
      !user.accessibleCompanyIds.includes(employee.company.id)
    ) {
      throw new Error('Access denied to this employee');
    }

    return employee;
  }

  /**
   * Get employee by employee_id (NIK)
   */
  async getByEmployeeId(employeeId: string, user: AuthUser): Promise<any> {
    const employee = await prisma.employee.findUnique({
      where: { employee_id: employeeId },
      select: EMPLOYEE_DETAIL_SELECT,
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    // Check company access
    if (
      !user.roles.includes('Super Admin') &&
      employee.company?.id &&
      !user.accessibleCompanyIds.includes(employee.company.id)
    ) {
      throw new Error('Access denied to this employee');
    }

    return employee;
  }

  /**
   * Create new employee
   */
  async create(data: CreateEmployeeDTO, user: AuthUser): Promise<any> {
    // Check company access if company_id is provided
    if (
      data.company_id &&
      !user.roles.includes('Super Admin') &&
      !user.accessibleCompanyIds.includes(data.company_id)
    ) {
      throw new Error('Access denied to create employee in this company');
    }

    // Generate employee_id if not provided
    if (!data.employee_id) {
      data.employee_id = await this.generateEmployeeId(data.company_id);
    }

    // Check if employee_id already exists
    if (data.employee_id) {
      const existing = await prisma.employee.findUnique({
        where: { employee_id: data.employee_id },
      });
      if (existing) {
        throw new Error('Employee ID already exists');
      }
    }

    // Prepare data for Prisma
    const createData: Prisma.EmployeeCreateInput = {
      name: data.name,
      employee_id: data.employee_id,
      nick_name: data.nick_name,
      date_of_birth: data.date_of_birth ? new Date(data.date_of_birth) : undefined,
      place_of_birth: data.place_of_birth,
      gender: data.gender,
      marital_status: data.marital_status,
      religion: data.religion,
      blood_type: data.blood_type,
      nationality: data.nationality,
      phone: data.phone,
      mobile_number: data.mobile_number,
      email: data.email,
      // Alamat KTP
      address: data.address,
      city: data.city,
      province: data.province,
      postal_code: data.postal_code,
      // Alamat Domisili
      current_address: data.current_address,
      current_city: data.current_city,
      current_province: data.current_province,
      current_postal_code: data.current_postal_code,
      national_id: data.national_id,
      tax_id: data.tax_id,
      npwp_number: data.npwp_number,
      passport_number: data.passport_number,
      passport_expiry: data.passport_expiry ? new Date(data.passport_expiry) : undefined,
      emergency_contact_name: data.emergency_contact_name,
      emergency_contact_phone: data.emergency_contact_phone,
      emergency_contact_relationship: data.emergency_contact_relationship,
      emergency_contact_address: data.emergency_contact_address,
      job_title: data.job_title,
      division: data.division,
      organizational_level: data.organizational_level,
      grade_level: data.grade_level,
      cost_center: data.cost_center,
      hire_date: data.hire_date ? new Date(data.hire_date) : undefined,
      join_date: data.join_date ? new Date(data.join_date) : undefined,
      probation_start_date: data.probation_start_date ? new Date(data.probation_start_date) : undefined,
      probation_end_date: data.probation_end_date ? new Date(data.probation_end_date) : undefined,
      contract_start_date: data.contract_start_date ? new Date(data.contract_start_date) : undefined,
      contract_end_date: data.contract_end_date ? new Date(data.contract_end_date) : undefined,
      employment_type: data.employment_type,
      employment_status: data.employment_status || 'active',
      work_schedule: data.work_schedule,
      assigned_shift: data.assigned_shift,
      basic_salary: data.basic_salary,
      salary_currency: data.salary_currency,
      pay_frequency: data.pay_frequency,
      pay_type: data.pay_type,
      transport_allowance: data.transport_allowance,
      meal_allowance: data.meal_allowance,
      position_allowance: data.position_allowance,
      communication_allowance: data.communication_allowance,
      housing_allowance: data.housing_allowance,
      performance_bonus: data.performance_bonus,
      tax_status: data.tax_status,
      ptkp_status: data.ptkp_status,
      bpjs_ketenagakerjaan_number: data.bpjs_ketenagakerjaan_number,
      bpjs_kesehatan_number: data.bpjs_kesehatan_number,
      jht_registered: data.jht_registered,
      jp_registered: data.jp_registered,
      medical_insurance: data.medical_insurance,
      life_insurance: data.life_insurance,
      // Relations - user is required for Employee
      user: data.user_id
        ? { connect: { id: data.user_id } }
        : { create: { email: data.email || `temp-${Date.now()}@temp.local`, password: 'temp' } },
      ...(data.company_id && { company: { connect: { id: data.company_id } } }),
      ...(data.department_id && { department: { connect: { id: data.department_id } } }),
      ...(data.position_id && { position: { connect: { id: data.position_id } } }),
      ...(data.work_location_id && { workLocationRef: { connect: { id: data.work_location_id } } }),
      ...(data.manager_id && { manager: { connect: { id: data.manager_id } } }),
      ...(data.direct_manager_id && { directManager: { connect: { id: data.direct_manager_id } } }),
      ...(data.skip_level_manager_id && { skipLevelManager: { connect: { id: data.skip_level_manager_id } } }),
      ...(data.salary_grade_id && { salaryGrade: { connect: { id: data.salary_grade_id } } }),
    };

    const employee = await prisma.employee.create({
      data: createData,
      select: EMPLOYEE_DETAIL_SELECT,
    });

    // Log audit
    await this.logAudit(user.id, 'create', 'employee', employee.id, null, employee);

    return employee;
  }

  /**
   * Update employee
   */
  async update(id: number, data: UpdateEmployeeDTO, user: AuthUser): Promise<any> {
    // Get existing employee
    const existing = await prisma.employee.findUnique({
      where: { id },
      include: { company: { select: { id: true } } },
    });

    if (!existing) {
      throw new Error('Employee not found');
    }

    // Check company access
    if (
      !user.roles.includes('Super Admin') &&
      existing.company_id &&
      !user.accessibleCompanyIds.includes(existing.company_id)
    ) {
      throw new Error('Access denied to update this employee');
    }

    // Check new company access if changing company
    if (
      data.company_id &&
      data.company_id !== existing.company_id &&
      !user.roles.includes('Super Admin') &&
      !user.accessibleCompanyIds.includes(data.company_id)
    ) {
      throw new Error('Access denied to transfer employee to this company');
    }

    // Prepare update data
    const updateData: Prisma.EmployeeUpdateInput = {};

    // Only include fields that are provided
    const directFields = [
      'name', 'employee_id', 'nick_name', 'place_of_birth', 'gender',
      'marital_status', 'religion', 'blood_type', 'nationality', 'phone',
      'mobile_number', 'email',
      // Alamat KTP
      'address', 'city', 'province', 'postal_code',
      // Alamat Domisili
      'current_address', 'current_city', 'current_province', 'current_postal_code',
      // Identity & Emergency
      'national_id', 'tax_id', 'npwp_number', 'passport_number',
      'emergency_contact_name', 'emergency_contact_phone',
      'emergency_contact_relationship', 'emergency_contact_address',
      // Job Info
      'job_title', 'division', 'organizational_level', 'grade_level', 'cost_center',
      'employment_type', 'employment_status', 'work_schedule', 'assigned_shift',
      // Resign Info
      'resign_type', 'resign_reason', 'resign_notes',
      // Salary
      'basic_salary', 'salary_currency', 'pay_frequency', 'pay_type',
      'transport_allowance', 'meal_allowance', 'position_allowance',
      'communication_allowance', 'housing_allowance', 'performance_bonus',
      // Tax & BPJS
      'tax_status', 'ptkp_status', 'bpjs_ketenagakerjaan_number',
      'bpjs_kesehatan_number', 'jht_registered', 'jp_registered',
      'medical_insurance', 'life_insurance',
      // Education & Family
      'last_education', 'education_major', 'education_institution', 'graduation_year',
      'spouse_name', 'children_count', 'number_of_dependents',
      // Bank Info
      'bank_name', 'bank_account_number', 'bank_account_holder', 'bank_branch',
    ];

    for (const field of directFields) {
      if (data[field as keyof UpdateEmployeeDTO] !== undefined) {
        (updateData as any)[field] = data[field as keyof UpdateEmployeeDTO];
      }
    }

    // Handle date fields
    const dateFields = [
      'date_of_birth', 'passport_expiry', 'hire_date', 'join_date',
      'probation_start_date', 'probation_end_date', 'contract_start_date',
      'contract_end_date', 'resign_date',
    ];

    for (const field of dateFields) {
      if (data[field as keyof UpdateEmployeeDTO] !== undefined) {
        const value = data[field as keyof UpdateEmployeeDTO];
        (updateData as any)[field] = value ? new Date(value as string) : null;
      }
    }

    // Handle relations
    if (data.company_id !== undefined) {
      updateData.company = data.company_id
        ? { connect: { id: data.company_id } }
        : { disconnect: true };
    }

    if (data.department_id !== undefined) {
      updateData.department = data.department_id
        ? { connect: { id: data.department_id } }
        : { disconnect: true };
    }

    if (data.position_id !== undefined) {
      updateData.position = data.position_id
        ? { connect: { id: data.position_id } }
        : { disconnect: true };
    }

    if (data.work_location_id !== undefined) {
      updateData.workLocationRef = data.work_location_id
        ? { connect: { id: data.work_location_id } }
        : { disconnect: true };
    }

    if (data.manager_id !== undefined) {
      updateData.manager = data.manager_id
        ? { connect: { id: data.manager_id } }
        : { disconnect: true };
    }

    if (data.direct_manager_id !== undefined) {
      updateData.directManager = data.direct_manager_id
        ? { connect: { id: data.direct_manager_id } }
        : { disconnect: true };
    }

    if (data.skip_level_manager_id !== undefined) {
      updateData.skipLevelManager = data.skip_level_manager_id
        ? { connect: { id: data.skip_level_manager_id } }
        : { disconnect: true };
    }

    if (data.leave_approver_id !== undefined) {
      updateData.leaveApprover = data.leave_approver_id
        ? { connect: { id: data.leave_approver_id } }
        : { disconnect: true };
    }

    if (data.overtime_approver_id !== undefined) {
      updateData.overtimeApprover = data.overtime_approver_id
        ? { connect: { id: data.overtime_approver_id } }
        : { disconnect: true };
    }

    const employee = await prisma.employee.update({
      where: { id },
      data: updateData,
      select: EMPLOYEE_DETAIL_SELECT,
    });

    // Log audit
    await this.logAudit(user.id, 'update', 'employee', id, existing, employee);

    return employee;
  }

  /**
   * Delete employee (soft delete by setting status)
   */
  async delete(id: number, user: AuthUser): Promise<void> {
    const employee = await prisma.employee.findUnique({
      where: { id },
      select: { id: true, company_id: true, name: true },
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    // Check company access
    if (
      !user.roles.includes('Super Admin') &&
      employee.company_id &&
      !user.accessibleCompanyIds.includes(employee.company_id)
    ) {
      throw new Error('Access denied to delete this employee');
    }

    // Soft delete - update status
    await prisma.employee.update({
      where: { id },
      data: { employment_status: 'terminated' },
    });

    // Log audit
    await this.logAudit(user.id, 'delete', 'employee', id, employee, null);
  }

  /**
   * Get employees by company
   */
  async getByCompany(companyId: number, user: AuthUser): Promise<any[]> {
    // Check company access
    if (
      !user.roles.includes('Super Admin') &&
      !user.accessibleCompanyIds.includes(companyId)
    ) {
      throw new Error('Access denied to this company');
    }

    const employees = await prisma.employee.findMany({
      where: {
        company_id: companyId,
        employee_id: { notIn: HIDDEN_EMPLOYEE_IDS },
      },
      select: EMPLOYEE_LIST_SELECT,
    });

    // Sort by company order then employee_id
    return employees.sort((a, b) => {
      const aCompanyCode = this.extractCompanyCode(a.employee_id);
      const bCompanyCode = this.extractCompanyCode(b.employee_id);
      const aOrder = COMPANY_ORDER.indexOf(aCompanyCode);
      const bOrder = COMPANY_ORDER.indexOf(bCompanyCode);
      const aIndex = aOrder === -1 ? COMPANY_ORDER.length : aOrder;
      const bIndex = bOrder === -1 ? COMPANY_ORDER.length : bOrder;
      if (aIndex !== bIndex) return aIndex - bIndex;
      return (a.employee_id || '').localeCompare(b.employee_id || '');
    });
  }

  /**
   * Get employees by department
   */
  async getByDepartment(departmentId: number, user: AuthUser): Promise<any[]> {
    const employees = await prisma.employee.findMany({
      where: {
        department_id: departmentId,
        employee_id: { notIn: HIDDEN_EMPLOYEE_IDS },
        ...(user.roles.includes('Super Admin')
          ? {}
          : { company_id: { in: user.accessibleCompanyIds } }),
      },
      select: EMPLOYEE_LIST_SELECT,
    });

    // Sort by company order then employee_id
    return employees.sort((a, b) => {
      const aCompanyCode = this.extractCompanyCode(a.employee_id);
      const bCompanyCode = this.extractCompanyCode(b.employee_id);
      const aOrder = COMPANY_ORDER.indexOf(aCompanyCode);
      const bOrder = COMPANY_ORDER.indexOf(bCompanyCode);
      const aIndex = aOrder === -1 ? COMPANY_ORDER.length : aOrder;
      const bIndex = bOrder === -1 ? COMPANY_ORDER.length : bOrder;
      if (aIndex !== bIndex) return aIndex - bIndex;
      return (a.employee_id || '').localeCompare(b.employee_id || '');
    });
  }

  /**
   * Get subordinates of a manager
   */
  async getSubordinates(managerId: number, user: AuthUser): Promise<any[]> {
    const employees = await prisma.employee.findMany({
      where: {
        OR: [
          { manager_id: managerId },
          { direct_manager_id: managerId },
        ],
        employee_id: { notIn: HIDDEN_EMPLOYEE_IDS },
        ...(user.roles.includes('Super Admin')
          ? {}
          : { company_id: { in: user.accessibleCompanyIds } }),
      },
      select: EMPLOYEE_LIST_SELECT,
    });

    // Sort by company order then employee_id
    return employees.sort((a, b) => {
      const aCompanyCode = this.extractCompanyCode(a.employee_id);
      const bCompanyCode = this.extractCompanyCode(b.employee_id);
      const aOrder = COMPANY_ORDER.indexOf(aCompanyCode);
      const bOrder = COMPANY_ORDER.indexOf(bCompanyCode);
      const aIndex = aOrder === -1 ? COMPANY_ORDER.length : aOrder;
      const bIndex = bOrder === -1 ? COMPANY_ORDER.length : bOrder;
      if (aIndex !== bIndex) return aIndex - bIndex;
      return (a.employee_id || '').localeCompare(b.employee_id || '');
    });
  }

  /**
   * Generate unique employee ID
   * Format: {HOLDING_CODE}-{COMPANY_CODE}-{YY}{NNNNN}
   * Example: PFI-GDI-2500001
   */
  async generateEmployeeId(companyId?: number): Promise<string> {
    // Get company info
    let companyCode = 'XXX';
    let holdingCode = 'PFI'; // Default holding code

    if (companyId) {
      const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: {
          code: true,
          parent_company_id: true,
          company_type: true,
          parent: {
            select: { code: true },
          },
        },
      });

      if (company) {
        companyCode = company.code || 'XXX';

        // If company has a parent (subsidiary/branch), use parent's code as holding code
        // If company is a holding (no parent), use its own code
        if (company.parent_company_id && company.parent) {
          holdingCode = company.parent.code || 'PFI';
        } else {
          // This is a holding company, use its own code
          holdingCode = company.code || 'PFI';
        }
      }
    }

    // Get current year (2 digits)
    const year = new Date().getFullYear().toString().slice(-2);

    // Build prefix for searching: HOLDING-COMPANY-YY
    const prefix = `${holdingCode}-${companyCode}-${year}`;

    // Find the last employee ID with this prefix
    const lastEmployee = await prisma.employee.findFirst({
      where: {
        employee_id: { startsWith: prefix },
      },
      orderBy: { employee_id: 'desc' },
      select: { employee_id: true },
    });

    let nextNumber = 1;
    if (lastEmployee?.employee_id) {
      // Extract the sequence number (last 5 digits after the year)
      const match = lastEmployee.employee_id.match(new RegExp(`${prefix}(\\d+)$`));
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    // Format: HOLDING-COMPANY-YYNNNNN (5 digits for sequence)
    return `${prefix}${nextNumber.toString().padStart(5, '0')}`;
  }

  /**
   * Required fields for profile completion
   */
  private readonly profileRequiredFields = [
    // Personal Data (phone is optional)
    'mobile_number',
    'address',
    'city',
    'province',
    'postal_code',
    // Emergency Contact
    'emergency_contact_name',
    'emergency_contact_phone',
    'emergency_contact_relationship',
    // Identity Documents (npwp is optional)
    'national_id',
    // Bank Information (bank_account_holder auto-filled from employee name)
    'bank_name',
    'bank_account_number',
  ];

  /**
   * Check if all required profile fields are filled
   */
  private isProfileComplete(employee: any): boolean {
    return this.profileRequiredFields.every((field) => {
      const value = employee[field];
      return value !== null && value !== undefined && value !== '';
    });
  }

  /**
   * Update my own profile with profile completion check
   */
  async updateMyProfile(
    employeeId: number,
    data: UpdateEmployeeDTO,
    user: AuthUser
  ): Promise<any> {
    // Get existing employee
    const existing = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!existing) {
      throw new Error('Employee not found');
    }

    // Prepare update data
    const updateData: Prisma.EmployeeUpdateInput = {};

    // Only include fields that are provided
    const allowedFields = [
      'phone', 'mobile_number',
      // Alamat KTP
      'address', 'city', 'province', 'postal_code',
      // Alamat Domisili
      'current_address', 'current_city', 'current_province', 'current_postal_code',
      // Emergency Contact
      'emergency_contact_name', 'emergency_contact_phone',
      'emergency_contact_relationship', 'emergency_contact_address',
      // Identity Documents (for profile completion)
      'national_id', 'npwp_number',
      // Bank Information (for profile completion)
      'bank_name', 'bank_account_number', 'bank_account_holder',
      // Avatar
      'avatar',
      // Education
      'last_education', 'education_major', 'education_institution', 'graduation_year',
      // Family
      'spouse_name', 'children_count', 'number_of_dependents',
    ];

    for (const field of allowedFields) {
      if (data[field as keyof UpdateEmployeeDTO] !== undefined) {
        (updateData as any)[field] = data[field as keyof UpdateEmployeeDTO];
      }
    }

    // Update employee
    let employee = await prisma.employee.update({
      where: { id: employeeId },
      data: updateData,
    });

    // Check if profile is now complete
    if (!existing.profile_completed && this.isProfileComplete(employee)) {
      employee = await prisma.employee.update({
        where: { id: employeeId },
        data: {
          profile_completed: true,
          profile_completed_at: new Date(),
        },
      });
    }

    // Return full employee data
    const fullEmployee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: EMPLOYEE_DETAIL_SELECT,
    });

    // Log audit
    await this.logAudit(user.id, 'update_profile', 'employee', employeeId, existing, fullEmployee);

    return fullEmployee;
  }

  /**
   * Export employees to Excel
   */
  async exportToExcel(
    query: EmployeeListQuery,
    user: AuthUser
  ) {
    const {
      search,
      company_id,
      department_id,
      position_id,
      employment_status,
      employment_type,
    } = query;

    // Build where clause (same logic as list, but no pagination)
    const where: Prisma.EmployeeWhereInput = {
      employee_id: { notIn: HIDDEN_EMPLOYEE_IDS },
      ...(user.roles.includes('Super Admin')
        ? {}
        : { company_id: { in: user.accessibleCompanyIds } }),
    };

    if (company_id) {
      where.company_id = company_id;
    }
    if (department_id) {
      where.department_id = department_id;
    }
    if (position_id) {
      where.position_id = position_id;
    }

    if (employment_status === 'inactive') {
      where.employment_status = { not: 'active' };
    } else if (employment_status === 'all') {
      // no filter
    } else {
      where.employment_status = 'active';
    }

    if (employment_type) {
      where.employment_type = employment_type;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { employee_id: { contains: search } },
        { email: { contains: search } },
        { mobile_number: { contains: search } },
      ];
    }

    const employees = await prisma.employee.findMany({
      where,
      select: EMPLOYEE_EXPORT_SELECT,
    });

    // Sort by company order then employee_id
    employees.sort((a: any, b: any) => {
      const aCode = this.extractCompanyCode(a.employee_id);
      const bCode = this.extractCompanyCode(b.employee_id);
      const aOrder = COMPANY_ORDER.indexOf(aCode);
      const bOrder = COMPANY_ORDER.indexOf(bCode);
      const aIndex = aOrder === -1 ? COMPANY_ORDER.length : aOrder;
      const bIndex = bOrder === -1 ? COMPANY_ORDER.length : bOrder;
      if (aIndex !== bIndex) return aIndex - bIndex;
      return (a.employee_id || '').localeCompare(b.employee_id || '');
    });

    const exportService = new EmployeeExportService();
    const exportedBy = user.employee?.name || user.email || 'System';
    return exportService.generateExcel(employees, exportedBy);
  }

  /**
   * Log audit trail
   */
  private async logAudit(
    userId: number,
    action: string,
    model: string,
    modelId: number,
    oldValues: any,
    newValues: any
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          user_id: userId,
          action,
          model,
          model_id: modelId,
          old_values: oldValues,
          new_values: newValues,
        },
      });
    } catch (error) {
      console.error('Failed to log audit:', error);
    }
  }

  /**
   * Get leadership team - employees who have direct reports
   */
  async getLeadershipTeam(user: AuthUser, companyId?: number): Promise<any[]> {
    // Build company filter based on user access
    let companyFilter: any = {};

    // If specific companyId is provided, use it (after validating access)
    if (companyId) {
      // Check if user has access to this company
      const hasAccess =
        user.roles.includes('Super Admin') ||
        user.roles.includes('Group CEO') ||
        (user.accessibleCompanyIds && user.accessibleCompanyIds.includes(companyId)) ||
        user.employee?.company_id === companyId;

      if (hasAccess) {
        companyFilter = { company_id: companyId };
      } else {
        // No access, return empty
        return [];
      }
    } else if (!user.roles.includes('Super Admin')) {
      // No specific companyId, use default logic based on role
      if (user.roles.includes('Group CEO')) {
        if (user.accessibleCompanyIds && user.accessibleCompanyIds.length > 0) {
          companyFilter = { company_id: { in: user.accessibleCompanyIds } };
        }
      } else if (user.roles.includes('CEO')) {
        // CEO without specific companyId should see only their own company
        if (user.employee?.company_id) {
          companyFilter = { company_id: user.employee.company_id };
        } else if (user.accessibleCompanyIds && user.accessibleCompanyIds.length > 0) {
          companyFilter = { company_id: { in: user.accessibleCompanyIds } };
        }
      } else {
        companyFilter = { company_id: { in: user.accessibleCompanyIds } };
      }
    }

    // Get all employees who have at least one direct report OR have leadership positions
    const leadersWithReports = await prisma.employee.findMany({
      where: {
        ...companyFilter,
        employment_status: 'active',
        employee_id: { notIn: HIDDEN_EMPLOYEE_IDS },
        OR: [
          { subordinates: { some: {} } },
          { directReports: { some: {} } },
          // Include employees with leadership positions even without subordinates
          { position: { name: { contains: 'CEO' } } },
          { position: { name: { contains: 'Director' } } },
          { position: { name: { contains: 'Head' } } },
          { position: { name: { contains: 'Chief' } } },
          // Include employees with CEO/Group CEO user role
          { user: { userRoles: { some: { role: { name: { in: ['CEO', 'Group CEO'] } } } } } },
        ],
      },
      select: {
        id: true,
        employee_id: true,
        name: true,
        email: true,
        phone: true,
        join_date: true,
        position: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
        company: { select: { id: true, name: true } },
        _count: {
          select: {
            subordinates: true,
            directReports: true,
          },
        },
      },
      orderBy: [
        { position: { name: 'asc' } },
        { name: 'asc' },
      ],
    });

    // Transform data
    return leadersWithReports.map((leader) => {
      const joinDate = leader.join_date ? new Date(leader.join_date) : null;
      const now = new Date();
      let tenure = '-';
      if (joinDate) {
        const years = Math.floor((now.getTime() - joinDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        const months = Math.floor(((now.getTime() - joinDate.getTime()) % (365.25 * 24 * 60 * 60 * 1000)) / (30 * 24 * 60 * 60 * 1000));
        if (years > 0) {
          tenure = `${years} year${years > 1 ? 's' : ''}${months > 0 ? ` ${months} mo` : ''}`;
        } else {
          tenure = `${months} month${months > 1 ? 's' : ''}`;
        }
      }

      return {
        id: leader.id,
        employee_id: leader.employee_id,
        name: leader.name,
        email: leader.email,
        phone: leader.phone,
        position: leader.position?.name || '-',
        department: leader.department?.name || '-',
        company: leader.company?.name || '-',
        join_date: leader.join_date,
        tenure,
        direct_reports: leader._count.subordinates + leader._count.directReports,
      };
    });
  }
}
