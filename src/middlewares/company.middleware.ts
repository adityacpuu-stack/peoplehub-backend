import { Request, Response, NextFunction } from 'express';

/**
 * Company access middleware
 * Ensures user can only access data from companies they have access to
 */

/**
 * Validate company ID from route parameter against user's accessible companies
 */
export const validateCompanyAccess = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  const paramCompanyId = req.params.companyId;
  const companyId = parseInt(Array.isArray(paramCompanyId) ? paramCompanyId[0] : paramCompanyId);

  if (isNaN(companyId)) {
    res.status(400).json({ message: 'Invalid company ID' });
    return;
  }

  // Super Admin and Tax roles have access to all companies
  if (
    req.user.roles.includes('Super Admin') ||
    req.user.roles.includes('Tax Manager') ||
    req.user.roles.includes('Tax Staff')
  ) {
    next();
    return;
  }

  if (!req.user.accessibleCompanyIds.includes(companyId)) {
    res.status(403).json({
      message: 'Access denied. You do not have access to this company.',
    });
    return;
  }

  next();
};

/**
 * Validate company ID from request body
 */
export const validateCompanyAccessFromBody = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  const companyId = req.body.company_id || req.body.companyId;

  if (!companyId) {
    next();
    return;
  }

  // Super Admin and Tax roles have access to all companies
  if (
    req.user.roles.includes('Super Admin') ||
    req.user.roles.includes('Tax Manager') ||
    req.user.roles.includes('Tax Staff')
  ) {
    next();
    return;
  }

  if (!req.user.accessibleCompanyIds.includes(parseInt(companyId))) {
    res.status(403).json({
      message: 'Access denied. You do not have access to this company.',
    });
    return;
  }

  next();
};

/**
 * Validate company ID from query parameter
 */
export const validateCompanyAccessFromQuery = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  const companyId = req.query.company_id || req.query.companyId;

  if (!companyId) {
    next();
    return;
  }

  // Super Admin and Tax roles have access to all companies
  if (
    req.user.roles.includes('Super Admin') ||
    req.user.roles.includes('Tax Manager') ||
    req.user.roles.includes('Tax Staff')
  ) {
    next();
    return;
  }

  const companyIdStr = Array.isArray(companyId) ? companyId[0] : companyId;
  if (!req.user.accessibleCompanyIds.includes(parseInt(companyIdStr as string))) {
    res.status(403).json({
      message: 'Access denied. You do not have access to this company.',
    });
    return;
  }

  next();
};

/**
 * Require user to have access to at least one company
 */
export const requireCompanyAccess = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  if (req.user.accessibleCompanyIds.length === 0) {
    res.status(403).json({
      message: 'Access denied. You are not assigned to any company.',
    });
    return;
  }

  next();
};

/**
 * Get default company ID for user
 * Returns user's own company or first accessible company
 */
export const getDefaultCompanyId = (req: Request): number | null => {
  if (!req.user) return null;

  // First try user's own company
  if (req.user.employee?.company_id) {
    return req.user.employee.company_id;
  }

  // Then first accessible company
  if (req.user.accessibleCompanyIds.length > 0) {
    return req.user.accessibleCompanyIds[0];
  }

  return null;
};

/**
 * Middleware to set default company if not provided
 */
export const setDefaultCompany = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  // Check various sources for company_id
  const companyId =
    req.params.companyId ||
    req.query.company_id ||
    req.query.companyId ||
    req.body.company_id ||
    req.body.companyId;

  if (!companyId) {
    // Set default company in request
    const defaultCompanyId = getDefaultCompanyId(req);
    if (defaultCompanyId) {
      req.body.company_id = defaultCompanyId;
    }
  }

  next();
};

/**
 * Filter company scope for queries
 * Returns Prisma where clause for company filtering
 */
export const getCompanyFilter = (req: Request) => {
  if (!req.user) {
    return { company_id: -1 }; // Return impossible filter if not authenticated
  }

  // Super Admin can see all
  if (req.user.roles.includes('Super Admin')) {
    return {};
  }

  // Filter by accessible companies
  return {
    company_id: {
      in: req.user.accessibleCompanyIds,
    },
  };
};

/**
 * Filter for specific company from request
 */
export const getRequestedCompanyFilter = (req: Request) => {
  const companyId =
    req.params.companyId ||
    req.query.company_id ||
    req.query.companyId ||
    req.body.company_id ||
    req.body.companyId;

  if (companyId) {
    const companyIdStr = Array.isArray(companyId) ? companyId[0] : companyId;
    return { company_id: parseInt(companyIdStr as string) };
  }

  return getCompanyFilter(req);
};
