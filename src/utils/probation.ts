/**
 * Probation-related helper functions for leave eligibility
 */

/**
 * Check if an employee is currently in probation period.
 * Returns true if probation_end_date is in the future.
 */
export function isEmployeeInProbation(probationEndDate: Date | null | undefined): boolean {
  if (!probationEndDate) return false;
  return new Date(probationEndDate) > new Date();
}

/**
 * Calculate prorated leave days based on remaining months after probation ends.
 *
 * Example: probation ends March 2026, default 12 days
 * → April-December = 9 months → 9/12 * 12 = 9 days
 *
 * Rounds down to nearest 0.5.
 */
export function calculateProratedLeaveDays(
  defaultDays: number,
  probationEndDate: Date,
  year: number
): number {
  const endDate = new Date(probationEndDate);
  const probationYear = endDate.getFullYear();

  // If probation ends in a future year, no leave for this year
  if (probationYear > year) return 0;

  // If probation ended in a previous year, full allocation
  if (probationYear < year) return defaultDays;

  // Probation ends this year — prorate from the month after probation ends
  const monthAfterProbation = endDate.getMonth() + 1; // 0-indexed, +1 = first eligible month
  const remainingMonths = 12 - monthAfterProbation;

  if (remainingMonths <= 0) return 0;

  const prorated = (remainingMonths / 12) * defaultDays;

  // Round down to nearest 0.5
  return Math.floor(prorated * 2) / 2;
}
