// Org chart node representing an employee in the hierarchy
export interface OrgChartNode {
  id: number;
  employee_id: string | null;
  name: string;
  job_title: string | null;
  avatar: string | null;
  department: {
    id: number;
    name: string;
  } | null;
  position: {
    id: number;
    name: string;
  } | null;
  company: {
    id: number;
    name: string;
  } | null;
  email: string | null;
  phone: string | null;
  employment_status: string | null;
  children: OrgChartNode[];
}

// Statistics for the org chart
export interface OrgChartStats {
  totalEmployees: number;
  totalDepartments: number;
  maxDepth: number;
  levelDistribution: { level: number; count: number }[];
}

// Full org chart response
export interface OrgChartResponse {
  tree: OrgChartNode[];
  stats: OrgChartStats;
}

// Query parameters for org chart
export interface OrgChartQuery {
  company_id?: number;
  department_id?: number;
  root_employee_id?: number;
  max_depth?: number;
}

// Employee data for org chart (internal use)
export interface OrgChartEmployee {
  id: number;
  employee_id: string | null;
  name: string;
  job_title: string | null;
  avatar: string | null;
  email: string | null;
  phone: string | null;
  employment_status: string | null;
  manager_id: number | null;
  direct_manager_id: number | null;
  company_id: number | null;
  department_id: number | null;
  department: {
    id: number;
    name: string;
  } | null;
  position: {
    id: number;
    name: string;
  } | null;
  company: {
    id: number;
    name: string;
  } | null;
}
