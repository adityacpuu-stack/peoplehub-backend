/**
 * TER Rate Calculation Service
 * Matches Laravel TERRateCalculationService exactly
 */

// PTKP Rates (annual)
const PTKP_RATES: Record<string, number> = {
  'K/0': 58500000,
  'K/1': 63000000,
  'K/2': 67500000,
  'K/3': 72000000,
  'TK/0': 54000000,
  'TK/1': 58500000,
  'TK/2': 63000000,
  'TK/3': 67500000,
};

// TER Golongan Mapping
const TER_GOLONGAN_MAPPING: Record<string, string> = {
  'K/0': 'A',
  'K/1': 'B',
  'K/2': 'B',
  'K/3': 'C',
  'TK/0': 'A',
  'TK/1': 'A',
  'TK/2': 'B',
  'TK/3': 'B',
};

export class TERRateService {
  /**
   * Get TER Rate based on monthly gross and golongan
   */
  getTERRate(monthlyGross: number, golongan: string): number {
    switch (golongan) {
      case 'A':
        return this.getTERRateGolonganA(monthlyGross);
      case 'B':
        return this.getTERRateGolonganB(monthlyGross);
      case 'C':
        return this.getTERRateGolonganC(monthlyGross);
      default:
        return this.getTERRateGolonganA(monthlyGross);
    }
  }

  /**
   * Get TER Rate Golongan A - Excel IF Formula
   */
  getTERRateGolonganA(amount: number): number {
    if (amount > 1140000000) return 0.34;
    else if (amount > 910000000) return 0.33;
    else if (amount > 695000000) return 0.32;
    else if (amount > 550000000) return 0.31;
    else if (amount > 454000000) return 0.30;
    else if (amount > 337000000) return 0.29;
    else if (amount > 206000000) return 0.28;
    else if (amount > 157000000) return 0.27;
    else if (amount > 125000000) return 0.26;
    else if (amount > 103000000) return 0.25;
    else if (amount > 89000000) return 0.24;
    else if (amount > 77500000) return 0.23;
    else if (amount > 68600000) return 0.22;
    else if (amount > 62200000) return 0.21;
    else if (amount > 56300000) return 0.20;
    else if (amount > 51400000) return 0.19;
    else if (amount > 47800000) return 0.18;
    else if (amount > 43850000) return 0.17;
    else if (amount > 39100000) return 0.16;
    else if (amount > 35400000) return 0.15;
    else if (amount > 32400000) return 0.14;
    else if (amount > 30050000) return 0.13;
    else if (amount > 28000000) return 0.12;
    else if (amount > 26450000) return 0.11;
    else if (amount > 24150000) return 0.10;
    else if (amount > 19750000) return 0.09;
    else if (amount > 16950000) return 0.08;
    else if (amount > 15100000) return 0.07;
    else if (amount > 13750000) return 0.06;
    else if (amount > 12500000) return 0.05;
    else if (amount > 11600000) return 0.04;
    else if (amount > 11050000) return 0.035;
    else if (amount > 10700000) return 0.03;
    else if (amount > 10350000) return 0.025;
    else if (amount > 10050000) return 0.0225;
    else if (amount > 9650000) return 0.02;
    else if (amount > 8550000) return 0.0175;
    else if (amount > 7500000) return 0.015;
    else if (amount > 6750000) return 0.0125;
    else if (amount > 6300000) return 0.01;
    else if (amount > 5950000) return 0.0075;
    else if (amount > 5650000) return 0.005;
    else if (amount > 5400000) return 0.0025;
    else return 0.00;
  }

  /**
   * Get TER Rate Golongan B - Excel IF Formula
   */
  getTERRateGolonganB(amount: number): number {
    if (amount > 1405000000) return 0.34;
    else if (amount > 957000000) return 0.33;
    else if (amount > 704000000) return 0.32;
    else if (amount > 555000000) return 0.31;
    else if (amount > 459000000) return 0.30;
    else if (amount > 374000000) return 0.29;
    else if (amount > 211000000) return 0.28;
    else if (amount > 163000000) return 0.27;
    else if (amount > 129000000) return 0.26;
    else if (amount > 109000000) return 0.25;
    else if (amount > 93000000) return 0.24;
    else if (amount > 80000000) return 0.23;
    else if (amount > 71000000) return 0.22;
    else if (amount > 64000000) return 0.21;
    else if (amount > 58500000) return 0.20;
    else if (amount > 53800000) return 0.19;
    else if (amount > 49500000) return 0.18;
    else if (amount > 45800000) return 0.17;
    else if (amount > 41100000) return 0.16;
    else if (amount > 37100000) return 0.15;
    else if (amount > 33950000) return 0.14;
    else if (amount > 31450000) return 0.13;
    else if (amount > 29350000) return 0.12;
    else if (amount > 27700000) return 0.11;
    else if (amount > 26000000) return 0.10;
    else if (amount > 21850000) return 0.09;
    else if (amount > 18450000) return 0.08;
    else if (amount > 16400000) return 0.07;
    else if (amount > 14950000) return 0.06;
    else if (amount > 13600000) return 0.05;
    else if (amount > 12600000) return 0.04;
    else if (amount > 11600000) return 0.03;
    else if (amount > 11250000) return 0.025;
    else if (amount > 10750000) return 0.02;
    else if (amount > 9200000) return 0.015;
    else if (amount > 7300000) return 0.01;
    else if (amount > 6850000) return 0.0075;
    else if (amount > 6500000) return 0.005;
    else if (amount > 6200000) return 0.0025;
    else return 0.00;
  }

  /**
   * Get TER Rate Golongan C - Excel IF Formula
   */
  getTERRateGolonganC(amount: number): number {
    if (amount > 1419000000) return 0.34;
    else if (amount > 965000000) return 0.33;
    else if (amount > 709000000) return 0.32;
    else if (amount > 561000000) return 0.31;
    else if (amount > 463000000) return 0.30;
    else if (amount > 390000000) return 0.29;
    else if (amount > 221000000) return 0.28;
    else if (amount > 169000000) return 0.27;
    else if (amount > 134000000) return 0.26;
    else if (amount > 110000000) return 0.25;
    else if (amount > 95600000) return 0.24;
    else if (amount > 83200000) return 0.23;
    else if (amount > 74500000) return 0.22;
    else if (amount > 66700000) return 0.21;
    else if (amount > 60400000) return 0.20;
    else if (amount > 55800000) return 0.19;
    else if (amount > 51200000) return 0.18;
    else if (amount > 47400000) return 0.17;
    else if (amount > 43000000) return 0.16;
    else if (amount > 38900000) return 0.15;
    else if (amount > 35400000) return 0.14;
    else if (amount > 32600000) return 0.13;
    else if (amount > 30100000) return 0.12;
    else if (amount > 28100000) return 0.11;
    else if (amount > 26600000) return 0.10;
    else if (amount > 22700000) return 0.09;
    else if (amount > 19500000) return 0.08;
    else if (amount > 17050000) return 0.07;
    else if (amount > 15550000) return 0.06;
    else if (amount > 14150000) return 0.05;
    else if (amount > 12950000) return 0.04;
    else if (amount > 12050000) return 0.03;
    else if (amount > 11200000) return 0.02;
    else if (amount > 10950000) return 0.0175;
    else if (amount > 9800000) return 0.015;
    else if (amount > 8850000) return 0.0125;
    else if (amount > 7800000) return 0.01;
    else if (amount > 7350000) return 0.0075;
    else if (amount > 6950000) return 0.005;
    else if (amount > 6600000) return 0.0025;
    else return 0.00;
  }

  /**
   * Calculate Gross Up with 2-Step TER Rate (Excel compatible)
   * Implements Excel formulas: =AP/(100-AT*100)*100 and =AP/(100-AU*100)*100
   */
  calculateGrossUpWithIteration(totalGross: number, terGolongan: string): {
    gross_up_amount: number;
    ter_rate: number;
    ter_rate_initial: number;
    gross_up_initial: number;
    iterations: number;
  } {
    // Step 1: Use TER Rate for Total Gross
    const terRateInitial = this.getTERRate(totalGross, terGolongan);
    const grossUpInitial = totalGross / (100 - terRateInitial * 100) * 100;

    // Step 2: Use TER Rate for Gross Up result
    const terRateFinal = this.getTERRate(grossUpInitial, terGolongan);
    const grossUpFinal = totalGross / (100 - terRateFinal * 100) * 100;

    return {
      gross_up_amount: grossUpFinal,
      ter_rate: terRateFinal,
      ter_rate_initial: terRateInitial,
      gross_up_initial: grossUpInitial,
      iterations: 2,
    };
  }

  /**
   * Get TER Golongan based on tax status
   */
  getTERGolongan(taxStatus: string): string {
    return TER_GOLONGAN_MAPPING[taxStatus] || 'A';
  }

  /**
   * Get PTKP based on tax status
   */
  getPTKP(taxStatus: string): number {
    return PTKP_RATES[taxStatus] || 54000000;
  }
}

export const terRateService = new TERRateService();
