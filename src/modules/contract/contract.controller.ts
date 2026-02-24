import { Request, Response } from 'express';
import { ContractService } from './contract.service';
import {
  ContractListQuery,
  MovementListQuery,
  CreateContractDTO,
  UpdateContractDTO,
  RenewContractDTO,
  TerminateContractDTO,
  CreateMovementDTO,
  ApproveMovementDTO,
  RejectMovementDTO,
} from './contract.types';

const contractService = new ContractService();

const getParam = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) return param[0] || '';
  return param || '';
};

// ==========================================
// CONTRACT CONTROLLERS
// ==========================================

export const listContracts = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }

    const query: ContractListQuery = {
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

    const result = await contractService.listContracts(query, req.user);
    res.status(200).json({ message: 'Contracts retrieved successfully', ...result });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getContractById = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }
    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) { res.status(400).json({ message: 'Invalid contract ID' }); return; }

    const contract = await contractService.getContractById(id, req.user);
    res.status(200).json({ message: 'Contract retrieved successfully', data: contract });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : error.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const getMyContracts = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }
    const contracts = await contractService.getMyContracts(req.user);
    res.status(200).json({ message: 'Contracts retrieved successfully', data: contracts });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getActiveContract = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }
    const employeeId = parseInt(getParam(req.params.employeeId));
    if (isNaN(employeeId)) { res.status(400).json({ message: 'Invalid employee ID' }); return; }

    const contract = await contractService.getActiveContract(employeeId, req.user);
    res.status(200).json({ message: 'Contract retrieved successfully', data: contract });
  } catch (error: any) {
    const status = error.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const getExpiringContracts = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }
    const days = parseInt(getParam(req.query.days as string)) || 30;
    const companyId = req.query.company_id ? parseInt(getParam(req.query.company_id as string)) : undefined;

    const contracts = await contractService.getExpiringContracts(days, companyId, req.user);
    res.status(200).json({ message: 'Expiring contracts retrieved successfully', data: contracts });
  } catch (error: any) {
    const status = error.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const createContract = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }
    const data: CreateContractDTO = req.body;

    if (!data.employee_id || !data.contract_type || !data.start_date) {
      res.status(400).json({ message: 'Employee ID, contract type, and start date are required' }); return;
    }

    const contract = await contractService.createContract(data, req.user);
    res.status(201).json({ message: 'Contract created successfully', data: contract });
  } catch (error: any) {
    const status = error.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const updateContract = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }
    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) { res.status(400).json({ message: 'Invalid contract ID' }); return; }

    const data: UpdateContractDTO = req.body;
    const contract = await contractService.updateContract(id, data, req.user);
    res.status(200).json({ message: 'Contract updated successfully', data: contract });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : error.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const activateContract = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }
    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) { res.status(400).json({ message: 'Invalid contract ID' }); return; }

    const contract = await contractService.activateContract(id, req.user);
    res.status(200).json({ message: 'Contract activated successfully', data: contract });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : error.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const renewContract = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }
    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) { res.status(400).json({ message: 'Invalid contract ID' }); return; }

    const data: RenewContractDTO = req.body;
    if (!data.new_start_date) {
      res.status(400).json({ message: 'New start date is required' }); return;
    }

    const contract = await contractService.renewContract(id, data, req.user);
    res.status(200).json({ message: 'Contract renewed successfully', data: contract });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : error.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const terminateContract = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }
    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) { res.status(400).json({ message: 'Invalid contract ID' }); return; }

    const data: TerminateContractDTO = req.body;
    if (!data.termination_date || !data.termination_reason) {
      res.status(400).json({ message: 'Termination date and reason are required' }); return;
    }

    const contract = await contractService.terminateContract(id, data, req.user);
    res.status(200).json({ message: 'Contract terminated successfully', data: contract });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : error.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};

// ==========================================
// MOVEMENT CONTROLLERS
// ==========================================

export const listMovements = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }

    const query: MovementListQuery = {
      page: parseInt(getParam(req.query.page as string)) || 1,
      limit: parseInt(getParam(req.query.limit as string)) || 10,
      employee_id: req.query.employee_id ? parseInt(getParam(req.query.employee_id as string)) : undefined,
      company_id: req.query.company_id ? parseInt(getParam(req.query.company_id as string)) : undefined,
      movement_type: getParam(req.query.movement_type as string) || undefined,
      status: getParam(req.query.status as string) || undefined,
      start_date: getParam(req.query.start_date as string) || undefined,
      end_date: getParam(req.query.end_date as string) || undefined,
    };

    const result = await contractService.listMovements(query, req.user);
    res.status(200).json({ message: 'Movements retrieved successfully', ...result });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getMovementById = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }
    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) { res.status(400).json({ message: 'Invalid movement ID' }); return; }

    const movement = await contractService.getMovementById(id, req.user);
    res.status(200).json({ message: 'Movement retrieved successfully', data: movement });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : error.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const getMyMovements = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }
    const movements = await contractService.getMyMovements(req.user);
    res.status(200).json({ message: 'Movements retrieved successfully', data: movements });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createMovement = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }
    const data: CreateMovementDTO = req.body;

    if (!data.employee_id || !data.movement_type || !data.effective_date) {
      res.status(400).json({ message: 'Employee ID, movement type, and effective date are required' }); return;
    }

    const movement = await contractService.createMovement(data, req.user);
    res.status(201).json({ message: 'Movement created successfully', data: movement });
  } catch (error: any) {
    const status = error.message.includes('Access denied') ? 403 : error.message.includes('not found') ? 404 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const approveMovement = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }
    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) { res.status(400).json({ message: 'Invalid movement ID' }); return; }

    const data: ApproveMovementDTO = req.body;
    const movement = await contractService.approveMovement(id, data, req.user);
    res.status(200).json({ message: 'Movement approved successfully', data: movement });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : error.message.includes('Can only') ? 400 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const rejectMovement = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }
    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) { res.status(400).json({ message: 'Invalid movement ID' }); return; }

    const data: RejectMovementDTO = req.body;
    if (!data.rejection_reason) {
      res.status(400).json({ message: 'Rejection reason is required' }); return;
    }

    const movement = await contractService.rejectMovement(id, data, req.user);
    res.status(200).json({ message: 'Movement rejected', data: movement });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : error.message.includes('Can only') ? 400 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const applyMovement = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }
    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) { res.status(400).json({ message: 'Invalid movement ID' }); return; }

    const movement = await contractService.applyMovement(id, req.user);
    res.status(200).json({ message: 'Movement applied successfully', data: movement });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : error.message.includes('Can only') || error.message.includes('already applied') ? 400 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const deleteMovement = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }
    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) { res.status(400).json({ message: 'Invalid movement ID' }); return; }

    await contractService.deleteMovement(id, req.user);
    res.status(200).json({ message: 'Movement deleted successfully' });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : error.message.includes('Access denied') ? 403 : error.message.includes('Cannot delete') ? 400 : 500;
    res.status(status).json({ message: error.message });
  }
};

// ==========================================
// GROUP CEO STATISTICS
// ==========================================

export const getGroupContractStatistics = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }

    const result = await contractService.getGroupContractStatistics();
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
