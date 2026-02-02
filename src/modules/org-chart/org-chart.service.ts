import { prisma } from '../../config/prisma';
import { AuthUser } from '../../types/auth.types';
import {
  OrgChartNode,
  OrgChartStats,
  OrgChartResponse,
  OrgChartQuery,
  OrgChartEmployee,
} from './org-chart.types';

// Hidden system accounts (Super Admin, etc.) - excluded from all listings
const HIDDEN_EMPLOYEE_IDS = ['EMP-001'];

// Select fields for org chart employees
const ORG_CHART_SELECT = {
  id: true,
  employee_id: true,
  name: true,
  job_title: true,
  avatar: true,
  email: true,
  phone: true,
  employment_status: true,
  manager_id: true,
  direct_manager_id: true,
  company_id: true,
  department_id: true,
  department: {
    select: { id: true, name: true },
  },
  position: {
    select: { id: true, name: true },
  },
  company: {
    select: { id: true, name: true },
  },
} as const;

export class OrgChartService {
  /**
   * Get org chart tree with statistics
   */
  async getOrgChart(
    query: OrgChartQuery,
    user: AuthUser
  ): Promise<OrgChartResponse> {
    const { company_id, department_id, root_employee_id, max_depth = 10 } = query;

    // Build where clause for filtered employees
    const where: any = {
      employment_status: { in: ['active', 'probation'] },
      employee_id: { notIn: HIDDEN_EMPLOYEE_IDS },
    };

    // Company scoping based on user access
    if (!user.roles.includes('Super Admin')) {
      where.company_id = { in: user.accessibleCompanyIds };
    }

    // Apply filters
    if (company_id) {
      where.company_id = company_id;
    }

    if (department_id) {
      where.department_id = department_id;
    }

    // Fetch filtered employees
    const filteredEmployees = await prisma.employee.findMany({
      where,
      select: ORG_CHART_SELECT,
      orderBy: [
        { company_id: 'asc' },
        { name: 'asc' },
      ],
    }) as OrgChartEmployee[];

    // Also fetch Group CEO (top-level employee with no manager) if company filter is applied
    // This ensures Group CEO is always at the top of the org chart
    let allEmployees = filteredEmployees;

    if (company_id || department_id) {
      // Find the Group CEO and all managers in the chain
      const topLevelWhere: any = {
        employment_status: { in: ['active', 'probation'] },
        employee_id: { notIn: HIDDEN_EMPLOYEE_IDS },
        manager_id: null,
        direct_manager_id: null,
      };

      if (!user.roles.includes('Super Admin')) {
        topLevelWhere.company_id = { in: user.accessibleCompanyIds };
      }

      const groupCEO = await prisma.employee.findFirst({
        where: topLevelWhere,
        select: ORG_CHART_SELECT,
        orderBy: { id: 'asc' }, // Get the first one (usually Group CEO)
      }) as OrgChartEmployee | null;

      if (groupCEO && !filteredEmployees.some(e => e.id === groupCEO.id)) {
        // Add Group CEO to the list
        allEmployees = [groupCEO, ...filteredEmployees];
      }

      // Also fetch intermediate managers to maintain hierarchy chain
      const managerIds = new Set<number>();
      filteredEmployees.forEach(emp => {
        if (emp.manager_id) managerIds.add(emp.manager_id);
        if (emp.direct_manager_id) managerIds.add(emp.direct_manager_id);
      });

      // Recursively find all managers up to Group CEO
      const fetchedManagerIds = new Set<number>(allEmployees.map(e => e.id));
      let idsToFetch = Array.from(managerIds).filter(id => !fetchedManagerIds.has(id));

      while (idsToFetch.length > 0) {
        const managers = await prisma.employee.findMany({
          where: {
            id: { in: idsToFetch },
            employment_status: { in: ['active', 'probation'] },
          },
          select: ORG_CHART_SELECT,
        }) as OrgChartEmployee[];

        allEmployees = [...allEmployees, ...managers];
        managers.forEach(m => fetchedManagerIds.add(m.id));

        // Find their managers
        const newManagerIds = new Set<number>();
        managers.forEach(m => {
          if (m.manager_id && !fetchedManagerIds.has(m.manager_id)) {
            newManagerIds.add(m.manager_id);
          }
          if (m.direct_manager_id && !fetchedManagerIds.has(m.direct_manager_id)) {
            newManagerIds.add(m.direct_manager_id);
          }
        });

        idsToFetch = Array.from(newManagerIds);
      }
    }

    // Build the tree structure
    let tree: OrgChartNode[];

    if (root_employee_id) {
      // Build tree from specific root
      tree = this.buildTreeFromRoot(allEmployees, root_employee_id, max_depth);
    } else {
      // Build tree from all root nodes (employees without managers)
      tree = this.buildFullTree(allEmployees, max_depth, company_id, department_id);
    }

    // Calculate statistics (use filtered employees for accurate count)
    const stats = this.calculateStats(filteredEmployees, tree);

    return { tree, stats };
  }

  /**
   * Get org chart for a specific employee (their subtree)
   */
  async getEmployeeSubtree(
    employeeId: number,
    user: AuthUser,
    maxDepth: number = 5
  ): Promise<OrgChartNode | null> {
    // Get the root employee
    const rootEmployee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: ORG_CHART_SELECT,
    }) as OrgChartEmployee | null;

    if (!rootEmployee) {
      return null;
    }

    // Check access
    if (
      !user.roles.includes('Super Admin') &&
      rootEmployee.company_id &&
      !user.accessibleCompanyIds.includes(rootEmployee.company_id)
    ) {
      throw new Error('Access denied to this employee');
    }

    // Get all employees that could be in this subtree
    const where: any = {
      employment_status: { in: ['active', 'probation'] },
      employee_id: { notIn: HIDDEN_EMPLOYEE_IDS },
    };

    if (!user.roles.includes('Super Admin')) {
      where.company_id = { in: user.accessibleCompanyIds };
    }

    const employees = await prisma.employee.findMany({
      where,
      select: ORG_CHART_SELECT,
    }) as OrgChartEmployee[];

    // Build tree from this root
    const tree = this.buildTreeFromRoot(employees, employeeId, maxDepth);

    return tree.length > 0 ? tree[0] : null;
  }

  /**
   * Build full org chart tree from all root nodes
   * When filters are applied, only show branches that lead to filtered employees
   */
  private buildFullTree(
    employees: OrgChartEmployee[],
    maxDepth: number,
    filterCompanyId?: number,
    filterDepartmentId?: number
  ): OrgChartNode[] {
    // Create a map for quick lookup
    const employeeMap = new Map<number, OrgChartEmployee>();
    const childrenMap = new Map<number, number[]>();

    employees.forEach(emp => {
      employeeMap.set(emp.id, emp);

      // Track children by manager_id or direct_manager_id
      const managerId = emp.direct_manager_id || emp.manager_id;
      if (managerId) {
        const children = childrenMap.get(managerId) || [];
        children.push(emp.id);
        childrenMap.set(managerId, children);
      }
    });

    // If filtering, mark which employees should be visible (filtered employees + their ancestors)
    let visibleEmployeeIds: Set<number> | null = null;

    if (filterCompanyId || filterDepartmentId) {
      visibleEmployeeIds = new Set<number>();

      // Find all employees matching the filter
      const filteredEmps = employees.filter(emp => {
        if (filterCompanyId && emp.company_id !== filterCompanyId) return false;
        if (filterDepartmentId && emp.department_id !== filterDepartmentId) return false;
        return true;
      });

      // Mark filtered employees and all their ancestors as visible
      const markAncestorsVisible = (empId: number) => {
        if (visibleEmployeeIds!.has(empId)) return;
        visibleEmployeeIds!.add(empId);

        const emp = employeeMap.get(empId);
        if (emp) {
          const managerId = emp.direct_manager_id || emp.manager_id;
          if (managerId && employeeMap.has(managerId)) {
            markAncestorsVisible(managerId);
          }
        }
      };

      filteredEmps.forEach(emp => markAncestorsVisible(emp.id));
    }

    // Find root nodes (employees without managers or whose managers are not in the list)
    const rootEmployees = employees.filter(emp => {
      const managerId = emp.direct_manager_id || emp.manager_id;
      const isRoot = !managerId || !employeeMap.has(managerId);

      // If filtering, only include visible root nodes
      if (visibleEmployeeIds && !visibleEmployeeIds.has(emp.id)) {
        return false;
      }

      return isRoot;
    });

    // Build tree recursively
    return rootEmployees.map(emp =>
      this.buildNode(emp, employeeMap, childrenMap, 0, maxDepth, visibleEmployeeIds)
    );
  }

  /**
   * Build tree from a specific root employee
   */
  private buildTreeFromRoot(
    employees: OrgChartEmployee[],
    rootId: number,
    maxDepth: number
  ): OrgChartNode[] {
    // Create maps for quick lookup
    const employeeMap = new Map<number, OrgChartEmployee>();
    const childrenMap = new Map<number, number[]>();

    employees.forEach(emp => {
      employeeMap.set(emp.id, emp);

      const managerId = emp.direct_manager_id || emp.manager_id;
      if (managerId) {
        const children = childrenMap.get(managerId) || [];
        children.push(emp.id);
        childrenMap.set(managerId, children);
      }
    });

    const rootEmployee = employeeMap.get(rootId);
    if (!rootEmployee) {
      return [];
    }

    return [this.buildNode(rootEmployee, employeeMap, childrenMap, 0, maxDepth)];
  }

  /**
   * Build a single node recursively
   */
  private buildNode(
    employee: OrgChartEmployee,
    employeeMap: Map<number, OrgChartEmployee>,
    childrenMap: Map<number, number[]>,
    depth: number,
    maxDepth: number,
    visibleEmployeeIds?: Set<number> | null
  ): OrgChartNode {
    const children: OrgChartNode[] = [];

    if (depth < maxDepth) {
      const childIds = childrenMap.get(employee.id) || [];
      for (const childId of childIds) {
        // If filtering, only include visible children
        if (visibleEmployeeIds && !visibleEmployeeIds.has(childId)) {
          continue;
        }

        const childEmployee = employeeMap.get(childId);
        if (childEmployee) {
          children.push(
            this.buildNode(childEmployee, employeeMap, childrenMap, depth + 1, maxDepth, visibleEmployeeIds)
          );
        }
      }
    }

    // Sort children by name
    children.sort((a, b) => a.name.localeCompare(b.name));

    return {
      id: employee.id,
      employee_id: employee.employee_id,
      name: employee.name,
      job_title: employee.job_title,
      avatar: employee.avatar,
      department: employee.department,
      position: employee.position,
      company: employee.company,
      email: employee.email,
      phone: employee.phone,
      employment_status: employee.employment_status,
      children,
    };
  }

  /**
   * Calculate org chart statistics
   */
  private calculateStats(
    employees: OrgChartEmployee[],
    tree: OrgChartNode[]
  ): OrgChartStats {
    // Count unique departments
    const departments = new Set<number>();
    employees.forEach(emp => {
      if (emp.department_id) {
        departments.add(emp.department_id);
      }
    });

    // Calculate max depth and level distribution
    const levelCounts = new Map<number, number>();
    let maxDepth = 0;

    const countLevels = (nodes: OrgChartNode[], level: number) => {
      for (const node of nodes) {
        levelCounts.set(level, (levelCounts.get(level) || 0) + 1);
        maxDepth = Math.max(maxDepth, level);

        if (node.children.length > 0) {
          countLevels(node.children, level + 1);
        }
      }
    };

    countLevels(tree, 1);

    // Convert level counts to array
    const levelDistribution: { level: number; count: number }[] = [];
    levelCounts.forEach((count, level) => {
      levelDistribution.push({ level, count });
    });
    levelDistribution.sort((a, b) => a.level - b.level);

    return {
      totalEmployees: employees.length,
      totalDepartments: departments.size,
      maxDepth,
      levelDistribution,
    };
  }
}
