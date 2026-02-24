import { Request, Response } from 'express';
import { ContractService } from './contract.service';
import { asyncHandler, BadRequestError } from '../../middlewares/error.middleware';

const contractService = new ContractService();

const getParam = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) return param[0] || '';
  return param || '';
};

// ==========================================
// CONTRACT CONTROLLERS
// ==========================================

export const listContracts = asyncHandler(async (req: Request, res: Response) => {
  const query = {
    page: parseInt(getParam(req.query.page as string)) || 1,
    limit: parseInt(getParam(req.query.limit as string)) || 10,
    employee_id: req.query.employee_id ? parseInt(getParam(req.query.employee_id as string)) : undefined,
    company_id: req.query.company_id ? parseInt(getParam(req.query.company_id as string)) : undefined,
    contract_type: getParam(req.query.contract_type as string) || undefined,
    status: getParam(req.query.status as string) || undefined,
    expiring_within_days: req.query.expiring_within_days ? parseInt(getParam(req.query.expiring_within_days as string)) : undefined,
    sort_by: getParam(req.query.sort_by as string) || undefined,
    sort_order: (getParam(req.query.sort_order as string) as 'asc' | 'desc') || undefined,
  };
  const result = await contractService.listContracts(query, req.user!);
  res.status(200).json({ message: 'Contracts retrieved successfully', ...result });
});

export const getContractById = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(getParam(req.params.id));
  if (isNaN(id)) throw new BadRequestError('Invalid contract ID');
  const contract = await contractService.getContractById(id, req.user!);
  res.status(200).json({ message: 'Contract retrieved successfully', data: contract });
});

export const getMyContracts = asyncHandler(async (req: Request, res: Response) => {
  const contracts = await contractService.getMyContracts(req.user!);
  res.status(200).json({ message: 'Contracts retrieved successfully', data: contracts });
});

export const getActiveContract = asyncHandler(async (req: Request, res: Response) => {
  const employeeId = parseInt(getParam(req.params.employeeId));
  if (isNaN(employeeId)) throw new BadRequestError('Invalid employee ID');
  const contract = await contractService.getActiveContract(employeeId, req.user!);
  res.status(200).json({ message: 'Contract retrieved successfully', data: contract });
});

export const getExpiringContracts = asyncHandler(async (req: Request, res: Response) => {
  const days = parseInt(getParam(req.query.days as string)) || 30;
  const companyId = req.query.company_id ? parseInt(getParam(req.query.company_id as string)) : undefined;
  const contracts = await contractService.getExpiringContracts(days, companyId, req.user!);
  res.status(200).json({ message: 'Expiring contracts retrieved successfully', data: contracts });
});

export const createContract = asyncHandler(async (req: Request, res: Response) => {
  const contract = await contractService.createContract(req.body, req.user!);
  res.status(201).json({ message: 'Contract created successfully', data: contract });
});

export const updateContract = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(getParam(req.params.id));
  if (isNaN(id)) throw new BadRequestError('Invalid contract ID');
  const contract = await contractService.updateContract(id, req.body, req.user!);
  res.status(200).json({ message: 'Contract updated successfully', data: contract });
});

export const activateContract = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(getParam(req.params.id));
  if (isNaN(id)) throw new BadRequestError('Invalid contract ID');
  const contract = await contractService.activateContract(id, req.user!);
  res.status(200).json({ message: 'Contract activated successfully', data: contract });
});

export const renewContract = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(getParam(req.params.id));
  if (isNaN(id)) throw new BadRequestError('Invalid contract ID');
  const contract = await contractService.renewContract(id, req.body, req.user!);
  res.status(200).json({ message: 'Contract renewed successfully', data: contract });
});

export const terminateContract = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(getParam(req.params.id));
  if (isNaN(id)) throw new BadRequestError('Invalid contract ID');
  const contract = await contractService.terminateContract(id, req.body, req.user!);
  res.status(200).json({ message: 'Contract terminated successfully', data: contract });
});

// ==========================================
// MOVEMENT CONTROLLERS
// ==========================================

export const listMovements = asyncHandler(async (req: Request, res: Response) => {
  const query = {
    page: parseInt(getParam(req.query.page as string)) || 1,
    limit: parseInt(getParam(req.query.limit as string)) || 10,
    employee_id: req.query.employee_id ? parseInt(getParam(req.query.employee_id as string)) : undefined,
    company_id: req.query.company_id ? parseInt(getParam(req.query.company_id as string)) : undefined,
    movement_type: getParam(req.query.movement_type as string) || undefined,
    status: getParam(req.query.status as string) || undefined,
    start_date: getParam(req.query.start_date as string) || undefined,
    end_date: getParam(req.query.end_date as string) || undefined,
  };
  const result = await contractService.listMovements(query, req.user!);
  res.status(200).json({ message: 'Movements retrieved successfully', ...result });
});

export const getMovementById = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(getParam(req.params.id));
  if (isNaN(id)) throw new BadRequestError('Invalid movement ID');
  const movement = await contractService.getMovementById(id, req.user!);
  res.status(200).json({ message: 'Movement retrieved successfully', data: movement });
});

export const getMyMovements = asyncHandler(async (req: Request, res: Response) => {
  const movements = await contractService.getMyMovements(req.user!);
  res.status(200).json({ message: 'Movements retrieved successfully', data: movements });
});

export const createMovement = asyncHandler(async (req: Request, res: Response) => {
  const movement = await contractService.createMovement(req.body, req.user!);
  res.status(201).json({ message: 'Movement created successfully', data: movement });
});

export const approveMovement = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(getParam(req.params.id));
  if (isNaN(id)) throw new BadRequestError('Invalid movement ID');
  const movement = await contractService.approveMovement(id, req.body, req.user!);
  res.status(200).json({ message: 'Movement approved successfully', data: movement });
});

export const rejectMovement = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(getParam(req.params.id));
  if (isNaN(id)) throw new BadRequestError('Invalid movement ID');
  const movement = await contractService.rejectMovement(id, req.body, req.user!);
  res.status(200).json({ message: 'Movement rejected', data: movement });
});

export const applyMovement = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(getParam(req.params.id));
  if (isNaN(id)) throw new BadRequestError('Invalid movement ID');
  const movement = await contractService.applyMovement(id, req.user!);
  res.status(200).json({ message: 'Movement applied successfully', data: movement });
});

export const deleteMovement = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(getParam(req.params.id));
  if (isNaN(id)) throw new BadRequestError('Invalid movement ID');
  await contractService.deleteMovement(id, req.user!);
  res.status(200).json({ message: 'Movement deleted successfully' });
});

// ==========================================
// GROUP CEO STATISTICS
// ==========================================

export const getGroupContractStatistics = asyncHandler(async (req: Request, res: Response) => {
  const result = await contractService.getGroupContractStatistics();
  res.status(200).json({ success: true, data: result });
});
