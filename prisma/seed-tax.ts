import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ==========================================
// PTKP 2024/2025 (Penghasilan Tidak Kena Pajak)
// ==========================================
const ptkpData = [
  { status: 'TK/0', description: 'Tidak Kawin, 0 tanggungan', amount: 54000000 },
  { status: 'TK/1', description: 'Tidak Kawin, 1 tanggungan', amount: 58500000 },
  { status: 'TK/2', description: 'Tidak Kawin, 2 tanggungan', amount: 63000000 },
  { status: 'TK/3', description: 'Tidak Kawin, 3 tanggungan', amount: 67500000 },
  { status: 'K/0', description: 'Kawin, 0 tanggungan', amount: 58500000 },
  { status: 'K/1', description: 'Kawin, 1 tanggungan', amount: 63000000 },
  { status: 'K/2', description: 'Kawin, 2 tanggungan', amount: 67500000 },
  { status: 'K/3', description: 'Kawin, 3 tanggungan', amount: 72000000 },
];

// ==========================================
// TER RATES 2024 (Tarif Efektif Rata-rata)
// Category A: TK/0, TK/1, K/0
// Category B: TK/2, K/1, K/2
// Category C: K/3
// ==========================================

// TER Category A (Monthly Income Brackets)
const terCategoryA = [
  { min: 0, max: 5400000, rate: 0 },
  { min: 5400001, max: 5650000, rate: 0.0025 },
  { min: 5650001, max: 5950000, rate: 0.005 },
  { min: 5950001, max: 6300000, rate: 0.0075 },
  { min: 6300001, max: 6750000, rate: 0.01 },
  { min: 6750001, max: 7500000, rate: 0.0125 },
  { min: 7500001, max: 8550000, rate: 0.015 },
  { min: 8550001, max: 9650000, rate: 0.0175 },
  { min: 9650001, max: 10050000, rate: 0.02 },
  { min: 10050001, max: 10350000, rate: 0.0225 },
  { min: 10350001, max: 10700000, rate: 0.025 },
  { min: 10700001, max: 11050000, rate: 0.03 },
  { min: 11050001, max: 11600000, rate: 0.035 },
  { min: 11600001, max: 12500000, rate: 0.04 },
  { min: 12500001, max: 13750000, rate: 0.05 },
  { min: 13750001, max: 15100000, rate: 0.06 },
  { min: 15100001, max: 16950000, rate: 0.07 },
  { min: 16950001, max: 19750000, rate: 0.08 },
  { min: 19750001, max: 24150000, rate: 0.09 },
  { min: 24150001, max: 26450000, rate: 0.10 },
  { min: 26450001, max: 28000000, rate: 0.11 },
  { min: 28000001, max: 30050000, rate: 0.12 },
  { min: 30050001, max: 32400000, rate: 0.13 },
  { min: 32400001, max: 35400000, rate: 0.14 },
  { min: 35400001, max: 39100000, rate: 0.15 },
  { min: 39100001, max: 43850000, rate: 0.16 },
  { min: 43850001, max: 47800000, rate: 0.17 },
  { min: 47800001, max: 51400000, rate: 0.18 },
  { min: 51400001, max: 56300000, rate: 0.19 },
  { min: 56300001, max: 62200000, rate: 0.20 },
  { min: 62200001, max: 68600000, rate: 0.21 },
  { min: 68600001, max: 77500000, rate: 0.22 },
  { min: 77500001, max: 89000000, rate: 0.23 },
  { min: 89000001, max: 103000000, rate: 0.24 },
  { min: 103000001, max: 125000000, rate: 0.25 },
  { min: 125000001, max: 157000000, rate: 0.26 },
  { min: 157000001, max: 206000000, rate: 0.27 },
  { min: 206000001, max: 337000000, rate: 0.28 },
  { min: 337000001, max: 454000000, rate: 0.29 },
  { min: 454000001, max: 550000000, rate: 0.30 },
  { min: 550000001, max: 695000000, rate: 0.31 },
  { min: 695000001, max: 910000000, rate: 0.32 },
  { min: 910000001, max: 1140000000, rate: 0.33 },
  { min: 1140000001, max: null, rate: 0.34 },
];

// TER Category B (Monthly Income Brackets)
const terCategoryB = [
  { min: 0, max: 6200000, rate: 0 },
  { min: 6200001, max: 6500000, rate: 0.0025 },
  { min: 6500001, max: 6850000, rate: 0.005 },
  { min: 6850001, max: 7300000, rate: 0.0075 },
  { min: 7300001, max: 9200000, rate: 0.01 },
  { min: 9200001, max: 10750000, rate: 0.015 },
  { min: 10750001, max: 11250000, rate: 0.02 },
  { min: 11250001, max: 11600000, rate: 0.025 },
  { min: 11600001, max: 12600000, rate: 0.03 },
  { min: 12600001, max: 13600000, rate: 0.04 },
  { min: 13600001, max: 14950000, rate: 0.05 },
  { min: 14950001, max: 16400000, rate: 0.06 },
  { min: 16400001, max: 18450000, rate: 0.07 },
  { min: 18450001, max: 21850000, rate: 0.08 },
  { min: 21850001, max: 26000000, rate: 0.09 },
  { min: 26000001, max: 27700000, rate: 0.10 },
  { min: 27700001, max: 29350000, rate: 0.11 },
  { min: 29350001, max: 31450000, rate: 0.12 },
  { min: 31450001, max: 33950000, rate: 0.13 },
  { min: 33950001, max: 37100000, rate: 0.14 },
  { min: 37100001, max: 41100000, rate: 0.15 },
  { min: 41100001, max: 45800000, rate: 0.16 },
  { min: 45800001, max: 49500000, rate: 0.17 },
  { min: 49500001, max: 53800000, rate: 0.18 },
  { min: 53800001, max: 58500000, rate: 0.19 },
  { min: 58500001, max: 64000000, rate: 0.20 },
  { min: 64000001, max: 71000000, rate: 0.21 },
  { min: 71000001, max: 80000000, rate: 0.22 },
  { min: 80000001, max: 93000000, rate: 0.23 },
  { min: 93000001, max: 109000000, rate: 0.24 },
  { min: 109000001, max: 129000000, rate: 0.25 },
  { min: 129000001, max: 163000000, rate: 0.26 },
  { min: 163000001, max: 211000000, rate: 0.27 },
  { min: 211000001, max: 374000000, rate: 0.28 },
  { min: 374000001, max: 459000000, rate: 0.29 },
  { min: 459000001, max: 555000000, rate: 0.30 },
  { min: 555000001, max: 704000000, rate: 0.31 },
  { min: 704000001, max: 957000000, rate: 0.32 },
  { min: 957000001, max: 1405000000, rate: 0.33 },
  { min: 1405000001, max: null, rate: 0.34 },
];

// TER Category C (Monthly Income Brackets)
const terCategoryC = [
  { min: 0, max: 6600000, rate: 0 },
  { min: 6600001, max: 6950000, rate: 0.0025 },
  { min: 6950001, max: 7350000, rate: 0.005 },
  { min: 7350001, max: 7800000, rate: 0.0075 },
  { min: 7800001, max: 8850000, rate: 0.01 },
  { min: 8850001, max: 9800000, rate: 0.0125 },
  { min: 9800001, max: 10950000, rate: 0.015 },
  { min: 10950001, max: 11200000, rate: 0.0175 },
  { min: 11200001, max: 12050000, rate: 0.02 },
  { min: 12050001, max: 12950000, rate: 0.03 },
  { min: 12950001, max: 14150000, rate: 0.04 },
  { min: 14150001, max: 15550000, rate: 0.05 },
  { min: 15550001, max: 17050000, rate: 0.06 },
  { min: 17050001, max: 19500000, rate: 0.07 },
  { min: 19500001, max: 22700000, rate: 0.08 },
  { min: 22700001, max: 26600000, rate: 0.09 },
  { min: 26600001, max: 28100000, rate: 0.10 },
  { min: 28100001, max: 30100000, rate: 0.11 },
  { min: 30100001, max: 32600000, rate: 0.12 },
  { min: 32600001, max: 35400000, rate: 0.13 },
  { min: 35400001, max: 38900000, rate: 0.14 },
  { min: 38900001, max: 43000000, rate: 0.15 },
  { min: 43000001, max: 47400000, rate: 0.16 },
  { min: 47400001, max: 51200000, rate: 0.17 },
  { min: 51200001, max: 55800000, rate: 0.18 },
  { min: 55800001, max: 60400000, rate: 0.19 },
  { min: 60400001, max: 66700000, rate: 0.20 },
  { min: 66700001, max: 74500000, rate: 0.21 },
  { min: 74500001, max: 83200000, rate: 0.22 },
  { min: 83200001, max: 95600000, rate: 0.23 },
  { min: 95600001, max: 110000000, rate: 0.24 },
  { min: 110000001, max: 134000000, rate: 0.25 },
  { min: 134000001, max: 169000000, rate: 0.26 },
  { min: 169000001, max: 221000000, rate: 0.27 },
  { min: 221000001, max: 390000000, rate: 0.28 },
  { min: 390000001, max: 463000000, rate: 0.29 },
  { min: 463000001, max: 561000000, rate: 0.30 },
  { min: 561000001, max: 709000000, rate: 0.31 },
  { min: 709000001, max: 965000000, rate: 0.32 },
  { min: 965000001, max: 1419000000, rate: 0.33 },
  { min: 1419000001, max: null, rate: 0.34 },
];

// Progressive Tax Brackets (PPh21 Pasal 17)
const progressiveTaxBrackets = [
  { bracket_name: 'Layer 1', min_income: 0, max_income: 60000000, rate: 0.05 },
  { bracket_name: 'Layer 2', min_income: 60000001, max_income: 250000000, rate: 0.15 },
  { bracket_name: 'Layer 3', min_income: 250000001, max_income: 500000000, rate: 0.25 },
  { bracket_name: 'Layer 4', min_income: 500000001, max_income: 5000000000, rate: 0.30 },
  { bracket_name: 'Layer 5', min_income: 5000000001, max_income: null, rate: 0.35 },
];

async function seedPTKP() {
  console.log('Seeding PTKP data...');

  for (const ptkp of ptkpData) {
    await prisma.pTKP.upsert({
      where: { status: ptkp.status },
      update: {
        description: ptkp.description,
        amount: ptkp.amount,
        is_active: true,
      },
      create: {
        status: ptkp.status,
        description: ptkp.description,
        amount: ptkp.amount,
        is_active: true,
      },
    });
  }

  console.log(`✓ Seeded ${ptkpData.length} PTKP records`);
}

async function seedTERRates() {
  console.log('Seeding TER rate configurations...');

  // Clear existing TER configurations
  await prisma.taxConfiguration.deleteMany({
    where: {
      tax_category: { startsWith: 'TER_' },
    },
  });

  const allTerRates = [
    ...terCategoryA.map((r) => ({ ...r, category: 'TER_A', description: 'TER Category A (TK/0, TK/1, K/0)' })),
    ...terCategoryB.map((r) => ({ ...r, category: 'TER_B', description: 'TER Category B (TK/2, K/1, K/2)' })),
    ...terCategoryC.map((r) => ({ ...r, category: 'TER_C', description: 'TER Category C (K/3)' })),
  ];

  for (const rate of allTerRates) {
    await prisma.taxConfiguration.create({
      data: {
        tax_category: rate.category,
        description: rate.description,
        min_income: rate.min,
        max_income: rate.max,
        tax_rate: rate.rate,
        is_active: true,
        effective_from: new Date('2024-01-01'),
      },
    });
  }

  console.log(`✓ Seeded ${allTerRates.length} TER rate configurations`);
}

async function seedProgressiveTaxBrackets() {
  console.log('Seeding Progressive Tax Brackets...');

  // Clear existing progressive brackets
  await prisma.taxBracket.deleteMany({});

  for (const bracket of progressiveTaxBrackets) {
    await prisma.taxBracket.create({
      data: {
        bracket_name: bracket.bracket_name,
        min_income: bracket.min_income,
        max_income: bracket.max_income,
        rate: bracket.rate,
        is_active: true,
      },
    });
  }

  console.log(`✓ Seeded ${progressiveTaxBrackets.length} Progressive Tax Brackets`);
}

async function main() {
  console.log('\n========================================');
  console.log('SEEDING TAX CONFIGURATION DATA');
  console.log('========================================\n');

  try {
    await seedPTKP();
    await seedTERRates();
    await seedProgressiveTaxBrackets();

    console.log('\n========================================');
    console.log('TAX CONFIGURATION SEEDING COMPLETE!');
    console.log('========================================\n');
  } catch (error) {
    console.error('Error seeding tax data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
