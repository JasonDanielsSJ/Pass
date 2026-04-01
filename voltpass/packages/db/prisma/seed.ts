/**
 * VoltPass Seed Data — idempotent, safe to re-run
 *
 * Covers 10 pilot states: TX, CA, FL, NV, AZ, CO, GA, NC, VA, PA
 * All StateRequirements + ReciprocityRules for journeyman and master levels.
 */
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// ─── State Requirements ───────────────────────────────────────────────────────

const stateRequirementsData: Prisma.StateRequirementCreateInput[] = [
  // ── TEXAS ──
  {
    stateCode: 'TX',
    tradeType: 'electrician',
    tradeLevel: 'journeyman',
    requirementType: 'exam',
    name: 'Texas Journeyman Electrician Exam',
    description: 'Pass the Texas Journeyman Electrician exam administered by TDLR.',
    feeAmount: 43,
    processingDays: 30,
    formUrl: 'https://www.tdlr.texas.gov/electricians/elec.htm',
    lastUpdated: new Date('2024-01-01'),
  },
  {
    stateCode: 'TX',
    tradeType: 'electrician',
    tradeLevel: 'master',
    requirementType: 'exam',
    name: 'Texas Master Electrician Exam',
    description: 'Pass the Texas Master Electrician exam administered by TDLR. Requires 4 years of journeyman experience.',
    feeAmount: 86,
    processingDays: 45,
    formUrl: 'https://www.tdlr.texas.gov/electricians/elec.htm',
    lastUpdated: new Date('2024-01-01'),
  },
  {
    stateCode: 'TX',
    tradeType: 'electrician',
    tradeLevel: 'contractor',
    requirementType: 'bond',
    name: 'Texas Electrical Contractor Bond',
    description: 'Obtain a surety bond. Amount varies by project size.',
    feeAmount: 200,
    processingDays: 10,
    formUrl: 'https://www.tdlr.texas.gov/electricians/elec.htm',
    lastUpdated: new Date('2024-01-01'),
  },
  {
    stateCode: 'TX',
    tradeType: 'electrician',
    tradeLevel: 'contractor',
    requirementType: 'fee',
    name: 'Texas Electrical Contractor License Fee',
    description: 'Annual license fee for electrical contractors.',
    feeAmount: 116,
    processingDays: 14,
    formUrl: 'https://www.tdlr.texas.gov/electricians/elec.htm',
    lastUpdated: new Date('2024-01-01'),
  },

  // ── CALIFORNIA ──
  {
    stateCode: 'CA',
    tradeType: 'electrician',
    tradeLevel: 'journeyman',
    requirementType: 'exam',
    name: 'California General Electrician Certification Exam',
    description: 'Pass the California General Electrician exam administered by DIR. Must document 8,000 hours of on-the-job training.',
    feeAmount: 125,
    processingDays: 60,
    formUrl: 'https://www.dir.ca.gov/databases/dwc/elecCert.html',
    lastUpdated: new Date('2024-01-01'),
  },
  {
    stateCode: 'CA',
    tradeType: 'electrician',
    tradeLevel: 'journeyman',
    requirementType: 'experience_years',
    name: 'California Journeyman Experience Requirement',
    description: '4 years (8,000 hours) of on-the-job electrical training required.',
    processingDays: 0,
    formUrl: 'https://www.dir.ca.gov/databases/dwc/elecCert.html',
    lastUpdated: new Date('2024-01-01'),
  },
  {
    stateCode: 'CA',
    tradeType: 'electrician',
    tradeLevel: 'master',
    requirementType: 'exam',
    name: 'California Master Electrician Certification Exam',
    description: 'Pass the California Master Electrician exam. Requires documented 8,000 hours as journeyman.',
    feeAmount: 125,
    processingDays: 60,
    formUrl: 'https://www.dir.ca.gov/databases/dwc/elecCert.html',
    lastUpdated: new Date('2024-01-01'),
  },
  {
    stateCode: 'CA',
    tradeType: 'electrician',
    tradeLevel: 'contractor',
    requirementType: 'bond',
    name: 'California CSLB Contractor Bond',
    description: '$15,000 contractor license bond required by the CSLB.',
    feeAmount: 150,
    processingDays: 7,
    formUrl: 'https://www.cslb.ca.gov/Contractors/Applicants/Contractor_Bond/',
    lastUpdated: new Date('2024-01-01'),
  },
  {
    stateCode: 'CA',
    tradeType: 'electrician',
    tradeLevel: 'contractor',
    requirementType: 'fee',
    name: 'California CSLB License Application Fee',
    description: 'License application fee paid to California Contractors State License Board.',
    feeAmount: 450,
    processingDays: 90,
    formUrl: 'https://www.cslb.ca.gov/Contractors/Applicants/',
    lastUpdated: new Date('2024-01-01'),
  },

  // ── FLORIDA ──
  {
    stateCode: 'FL',
    tradeType: 'electrician',
    tradeLevel: 'journeyman',
    requirementType: 'exam',
    name: 'Florida Journeyman Electrician Exam',
    description: 'Pass the Florida journeyman electrician exam administered by Prometric. Requires proof of 4 years experience.',
    feeAmount: 75,
    processingDays: 30,
    formUrl: 'https://www.myfloridalicense.com/intentions2.asp?chBoard=true&boardid=57',
    lastUpdated: new Date('2024-01-01'),
  },
  {
    stateCode: 'FL',
    tradeType: 'electrician',
    tradeLevel: 'master',
    requirementType: 'exam',
    name: 'Florida Master Electrician Exam',
    description: 'Pass the Florida master electrician exam. Requires 1 year as licensed journeyman.',
    feeAmount: 100,
    processingDays: 45,
    formUrl: 'https://www.myfloridalicense.com/intentions2.asp?chBoard=true&boardid=57',
    lastUpdated: new Date('2024-01-01'),
  },
  {
    stateCode: 'FL',
    tradeType: 'electrician',
    tradeLevel: 'contractor',
    requirementType: 'bond',
    name: 'Florida Electrical Contractor Bond',
    description: '$5,000 surety bond required for Florida electrical contractors.',
    feeAmount: 100,
    processingDays: 7,
    formUrl: 'https://www.myfloridalicense.com/DBPR/electrical-contractors/',
    lastUpdated: new Date('2024-01-01'),
  },
  {
    stateCode: 'FL',
    tradeType: 'electrician',
    tradeLevel: 'contractor',
    requirementType: 'fee',
    name: 'Florida Electrical Contractor License Fee',
    description: 'Biennial license fee for electrical contractors.',
    feeAmount: 209,
    processingDays: 30,
    formUrl: 'https://www.myfloridalicense.com/DBPR/electrical-contractors/',
    lastUpdated: new Date('2024-01-01'),
  },

  // ── NEVADA ──
  {
    stateCode: 'NV',
    tradeType: 'electrician',
    tradeLevel: 'journeyman',
    requirementType: 'exam',
    name: 'Nevada Journeyman Electrician Exam',
    description: 'Exam administered by the Nevada State Contractors Board or local jurisdiction. NV has broad reciprocity with other states.',
    feeAmount: 50,
    processingDays: 21,
    formUrl: 'https://www.nscb.state.nv.us/',
    lastUpdated: new Date('2024-01-01'),
  },
  {
    stateCode: 'NV',
    tradeType: 'electrician',
    tradeLevel: 'master',
    requirementType: 'exam',
    name: 'Nevada Master Electrician Exam',
    description: 'Exam required for master electrician classification in Nevada.',
    feeAmount: 100,
    processingDays: 30,
    formUrl: 'https://www.nscb.state.nv.us/',
    lastUpdated: new Date('2024-01-01'),
  },
  {
    stateCode: 'NV',
    tradeType: 'electrician',
    tradeLevel: 'contractor',
    requirementType: 'bond',
    name: 'Nevada Contractor Bond',
    description: 'Surety bond required based on license classification.',
    feeAmount: 300,
    processingDays: 10,
    formUrl: 'https://www.nscb.state.nv.us/',
    lastUpdated: new Date('2024-01-01'),
  },
  {
    stateCode: 'NV',
    tradeType: 'electrician',
    tradeLevel: 'contractor',
    requirementType: 'fee',
    name: 'Nevada Contractor License Fee',
    description: 'Annual license fee for Nevada electrical contractors.',
    feeAmount: 400,
    processingDays: 14,
    formUrl: 'https://www.nscb.state.nv.us/',
    lastUpdated: new Date('2024-01-01'),
  },

  // ── ARIZONA ──
  {
    stateCode: 'AZ',
    tradeType: 'electrician',
    tradeLevel: 'journeyman',
    requirementType: 'exam',
    name: 'Arizona Journeyman Electrician Exam',
    description: 'Pass the Arizona journeyman exam through the Registrar of Contractors.',
    feeAmount: 50,
    processingDays: 21,
    formUrl: 'https://roc.az.gov/',
    lastUpdated: new Date('2024-01-01'),
  },
  {
    stateCode: 'AZ',
    tradeType: 'electrician',
    tradeLevel: 'master',
    requirementType: 'exam',
    name: 'Arizona Master Electrician Exam',
    description: 'Pass the Arizona master electrician exam.',
    feeAmount: 75,
    processingDays: 30,
    formUrl: 'https://roc.az.gov/',
    lastUpdated: new Date('2024-01-01'),
  },
  {
    stateCode: 'AZ',
    tradeType: 'electrician',
    tradeLevel: 'contractor',
    requirementType: 'bond',
    name: 'Arizona Contractor Bond',
    description: '$5,000 – $100,000 bond depending on contract amount.',
    feeAmount: 200,
    processingDays: 10,
    formUrl: 'https://roc.az.gov/',
    lastUpdated: new Date('2024-01-01'),
  },
  {
    stateCode: 'AZ',
    tradeType: 'electrician',
    tradeLevel: 'contractor',
    requirementType: 'fee',
    name: 'Arizona Contractor License Fee',
    description: 'License fee for Arizona ROC electrical contractor.',
    feeAmount: 410,
    processingDays: 21,
    formUrl: 'https://roc.az.gov/',
    lastUpdated: new Date('2024-01-01'),
  },

  // ── COLORADO ──
  {
    stateCode: 'CO',
    tradeType: 'electrician',
    tradeLevel: 'journeyman',
    requirementType: 'exam',
    name: 'Colorado Journeyman Electrician Exam',
    description: 'Pass the Colorado journeyman electrician exam through the Division of Professions and Occupations.',
    feeAmount: 70,
    processingDays: 30,
    formUrl: 'https://dpo.colorado.gov/Electrical',
    lastUpdated: new Date('2024-01-01'),
  },
  {
    stateCode: 'CO',
    tradeType: 'electrician',
    tradeLevel: 'master',
    requirementType: 'exam',
    name: 'Colorado Master Electrician Exam',
    description: 'Pass the Colorado master electrician exam.',
    feeAmount: 140,
    processingDays: 45,
    formUrl: 'https://dpo.colorado.gov/Electrical',
    lastUpdated: new Date('2024-01-01'),
  },
  {
    stateCode: 'CO',
    tradeType: 'electrician',
    tradeLevel: 'contractor',
    requirementType: 'bond',
    name: 'Colorado Electrical Contractor Bond',
    description: '$10,000 surety bond required.',
    feeAmount: 150,
    processingDays: 7,
    formUrl: 'https://dpo.colorado.gov/Electrical',
    lastUpdated: new Date('2024-01-01'),
  },
  {
    stateCode: 'CO',
    tradeType: 'electrician',
    tradeLevel: 'contractor',
    requirementType: 'fee',
    name: 'Colorado Electrical Contractor License Fee',
    description: 'License fee for Colorado electrical contractors.',
    feeAmount: 210,
    processingDays: 21,
    formUrl: 'https://dpo.colorado.gov/Electrical',
    lastUpdated: new Date('2024-01-01'),
  },

  // ── GEORGIA ──
  {
    stateCode: 'GA',
    tradeType: 'electrician',
    tradeLevel: 'journeyman',
    requirementType: 'exam',
    name: 'Georgia Journeyman Electrician Exam',
    description: 'Journeyman exam administered by Georgia Secretary of State.',
    feeAmount: 50,
    processingDays: 30,
    formUrl: 'https://sos.ga.gov/index.php/Licensing/plb/42',
    lastUpdated: new Date('2024-01-01'),
  },
  {
    stateCode: 'GA',
    tradeType: 'electrician',
    tradeLevel: 'master',
    requirementType: 'exam',
    name: 'Georgia Master Electrician Exam',
    description: 'Master electrician exam administered by the State Electrical Board.',
    feeAmount: 100,
    processingDays: 45,
    formUrl: 'https://sos.ga.gov/index.php/Licensing/plb/42',
    lastUpdated: new Date('2024-01-01'),
  },
  {
    stateCode: 'GA',
    tradeType: 'electrician',
    tradeLevel: 'contractor',
    requirementType: 'bond',
    name: 'Georgia Low Voltage Contractor Bond',
    description: 'Surety bond required for electrical contractors.',
    feeAmount: 100,
    processingDays: 7,
    formUrl: 'https://sos.ga.gov/index.php/Licensing/plb/42',
    lastUpdated: new Date('2024-01-01'),
  },
  {
    stateCode: 'GA',
    tradeType: 'electrician',
    tradeLevel: 'contractor',
    requirementType: 'fee',
    name: 'Georgia Electrical Contractor License Fee',
    description: 'Biennial license fee for electrical contractors.',
    feeAmount: 300,
    processingDays: 30,
    formUrl: 'https://sos.ga.gov/index.php/Licensing/plb/42',
    lastUpdated: new Date('2024-01-01'),
  },

  // ── NORTH CAROLINA ──
  {
    stateCode: 'NC',
    tradeType: 'electrician',
    tradeLevel: 'journeyman',
    requirementType: 'exam',
    name: 'North Carolina Journeyman Electrician Exam',
    description: 'Exam administered by the NC State Board of Examiners of Electrical Contractors.',
    feeAmount: 75,
    processingDays: 30,
    formUrl: 'https://www.ncbeec.org/',
    lastUpdated: new Date('2024-01-01'),
  },
  {
    stateCode: 'NC',
    tradeType: 'electrician',
    tradeLevel: 'master',
    requirementType: 'exam',
    name: 'North Carolina Master Electrician Exam',
    description: 'Master electrician exam. Must have 4 years experience and pass theory exam.',
    feeAmount: 100,
    processingDays: 45,
    formUrl: 'https://www.ncbeec.org/',
    lastUpdated: new Date('2024-01-01'),
  },
  {
    stateCode: 'NC',
    tradeType: 'electrician',
    tradeLevel: 'contractor',
    requirementType: 'bond',
    name: 'North Carolina Electrical Contractor Bond',
    description: '$10,000 surety bond.',
    feeAmount: 200,
    processingDays: 10,
    formUrl: 'https://www.ncbeec.org/',
    lastUpdated: new Date('2024-01-01'),
  },
  {
    stateCode: 'NC',
    tradeType: 'electrician',
    tradeLevel: 'contractor',
    requirementType: 'fee',
    name: 'North Carolina Electrical Contractor License Fee',
    description: 'Annual license fee.',
    feeAmount: 250,
    processingDays: 21,
    formUrl: 'https://www.ncbeec.org/',
    lastUpdated: new Date('2024-01-01'),
  },

  // ── VIRGINIA ──
  {
    stateCode: 'VA',
    tradeType: 'electrician',
    tradeLevel: 'journeyman',
    requirementType: 'exam',
    name: 'Virginia Journeyman Electrician Exam',
    description: 'Journeyman exam administered by DPOR.',
    feeAmount: 50,
    processingDays: 30,
    formUrl: 'https://www.dpor.virginia.gov/ElectricalBoards',
    lastUpdated: new Date('2024-01-01'),
  },
  {
    stateCode: 'VA',
    tradeType: 'electrician',
    tradeLevel: 'master',
    requirementType: 'exam',
    name: 'Virginia Master Electrician Exam',
    description: 'Master electrician exam via DPOR. Requires 1 year as licensed journeyman.',
    feeAmount: 85,
    processingDays: 45,
    formUrl: 'https://www.dpor.virginia.gov/ElectricalBoards',
    lastUpdated: new Date('2024-01-01'),
  },
  {
    stateCode: 'VA',
    tradeType: 'electrician',
    tradeLevel: 'contractor',
    requirementType: 'bond',
    name: 'Virginia Electrical Contractor Bond',
    description: '$2,500 surety bond for Class A/B contractors.',
    feeAmount: 75,
    processingDays: 7,
    formUrl: 'https://www.dpor.virginia.gov/ElectricalBoards',
    lastUpdated: new Date('2024-01-01'),
  },
  {
    stateCode: 'VA',
    tradeType: 'electrician',
    tradeLevel: 'contractor',
    requirementType: 'fee',
    name: 'Virginia Contractor License Fee',
    description: 'DPOR license fee for electrical contractors.',
    feeAmount: 200,
    processingDays: 21,
    formUrl: 'https://www.dpor.virginia.gov/ElectricalBoards',
    lastUpdated: new Date('2024-01-01'),
  },

  // ── PENNSYLVANIA ──
  {
    stateCode: 'PA',
    tradeType: 'electrician',
    tradeLevel: 'journeyman',
    requirementType: 'exam',
    name: 'Pennsylvania Journeyman Electrician Exam',
    description: 'Local jurisdiction exams (PA does not have a statewide license — most cities require local permits).',
    feeAmount: 50,
    processingDays: 21,
    formUrl: 'https://www.dos.pa.gov/ProfessionalLicensing/',
    lastUpdated: new Date('2024-01-01'),
  },
  {
    stateCode: 'PA',
    tradeType: 'electrician',
    tradeLevel: 'master',
    requirementType: 'exam',
    name: 'Pennsylvania Master Electrician Exam',
    description: 'Local jurisdiction master exam (Philadelphia, Pittsburgh have their own boards).',
    feeAmount: 100,
    processingDays: 45,
    formUrl: 'https://www.dos.pa.gov/ProfessionalLicensing/',
    lastUpdated: new Date('2024-01-01'),
  },
  {
    stateCode: 'PA',
    tradeType: 'electrician',
    tradeLevel: 'contractor',
    requirementType: 'bond',
    name: 'Pennsylvania Contractor Bond',
    description: '$50,000 bond for home improvement contractors.',
    feeAmount: 500,
    processingDays: 14,
    formUrl: 'https://www.attny.pacontractors.org/',
    lastUpdated: new Date('2024-01-01'),
  },
  {
    stateCode: 'PA',
    tradeType: 'electrician',
    tradeLevel: 'contractor',
    requirementType: 'fee',
    name: 'Pennsylvania Home Improvement Contractor Registration Fee',
    description: 'Registration fee for home improvement contractors.',
    feeAmount: 50,
    processingDays: 14,
    formUrl: 'https://www.attny.pacontractors.org/',
    lastUpdated: new Date('2024-01-01'),
  },
];

// ─── Reciprocity Rules ────────────────────────────────────────────────────────
// Based on NASCLA, state board websites, and known reciprocity agreements.
// 10 states × 9 partner states × 2 trade levels = 180 possible combinations
// We define all meaningful pairs here.

const STATES = ['TX', 'CA', 'FL', 'NV', 'AZ', 'CO', 'GA', 'NC', 'VA', 'PA'] as const;

type State = typeof STATES[number];

// Reciprocity matrix: [homeState][targetState] = { journeyman: status, master: status }
const RECIPROCITY_MATRIX: Record<State, Record<State, { journeyman: 'full' | 'partial' | 'none'; master: 'full' | 'partial' | 'none' }>> = {
  TX: {
    CA: { journeyman: 'partial', master: 'partial' },
    FL: { journeyman: 'full', master: 'full' },
    NV: { journeyman: 'full', master: 'partial' },
    AZ: { journeyman: 'full', master: 'full' },
    CO: { journeyman: 'partial', master: 'partial' },
    GA: { journeyman: 'full', master: 'full' },
    NC: { journeyman: 'partial', master: 'partial' },
    VA: { journeyman: 'full', master: 'partial' },
    PA: { journeyman: 'none', master: 'none' },
    TX: { journeyman: 'full', master: 'full' }, // placeholder, won't be inserted
  },
  CA: {
    TX: { journeyman: 'none', master: 'none' },
    FL: { journeyman: 'none', master: 'none' },
    NV: { journeyman: 'none', master: 'none' },
    AZ: { journeyman: 'none', master: 'none' },
    CO: { journeyman: 'none', master: 'none' },
    GA: { journeyman: 'none', master: 'none' },
    NC: { journeyman: 'none', master: 'none' },
    VA: { journeyman: 'none', master: 'none' },
    PA: { journeyman: 'none', master: 'none' },
    CA: { journeyman: 'full', master: 'full' },
  },
  FL: {
    TX: { journeyman: 'full', master: 'full' },
    CA: { journeyman: 'partial', master: 'partial' },
    NV: { journeyman: 'full', master: 'partial' },
    AZ: { journeyman: 'full', master: 'full' },
    CO: { journeyman: 'partial', master: 'partial' },
    GA: { journeyman: 'full', master: 'full' },
    NC: { journeyman: 'full', master: 'partial' },
    VA: { journeyman: 'full', master: 'full' },
    PA: { journeyman: 'none', master: 'none' },
    FL: { journeyman: 'full', master: 'full' },
  },
  NV: {
    TX: { journeyman: 'full', master: 'partial' },
    CA: { journeyman: 'partial', master: 'partial' },
    FL: { journeyman: 'full', master: 'partial' },
    AZ: { journeyman: 'full', master: 'full' },
    CO: { journeyman: 'full', master: 'full' },
    GA: { journeyman: 'full', master: 'partial' },
    NC: { journeyman: 'partial', master: 'partial' },
    VA: { journeyman: 'full', master: 'partial' },
    PA: { journeyman: 'none', master: 'none' },
    NV: { journeyman: 'full', master: 'full' },
  },
  AZ: {
    TX: { journeyman: 'full', master: 'full' },
    CA: { journeyman: 'partial', master: 'partial' },
    FL: { journeyman: 'full', master: 'full' },
    NV: { journeyman: 'full', master: 'full' },
    CO: { journeyman: 'full', master: 'full' },
    GA: { journeyman: 'full', master: 'partial' },
    NC: { journeyman: 'partial', master: 'partial' },
    VA: { journeyman: 'full', master: 'partial' },
    PA: { journeyman: 'none', master: 'none' },
    AZ: { journeyman: 'full', master: 'full' },
  },
  CO: {
    TX: { journeyman: 'partial', master: 'partial' },
    CA: { journeyman: 'partial', master: 'partial' },
    FL: { journeyman: 'partial', master: 'partial' },
    NV: { journeyman: 'full', master: 'full' },
    AZ: { journeyman: 'full', master: 'full' },
    GA: { journeyman: 'partial', master: 'partial' },
    NC: { journeyman: 'partial', master: 'partial' },
    VA: { journeyman: 'partial', master: 'partial' },
    PA: { journeyman: 'none', master: 'none' },
    CO: { journeyman: 'full', master: 'full' },
  },
  GA: {
    TX: { journeyman: 'full', master: 'full' },
    CA: { journeyman: 'partial', master: 'partial' },
    FL: { journeyman: 'full', master: 'full' },
    NV: { journeyman: 'full', master: 'partial' },
    AZ: { journeyman: 'full', master: 'partial' },
    CO: { journeyman: 'partial', master: 'partial' },
    NC: { journeyman: 'full', master: 'full' },
    VA: { journeyman: 'full', master: 'full' },
    PA: { journeyman: 'none', master: 'none' },
    GA: { journeyman: 'full', master: 'full' },
  },
  NC: {
    TX: { journeyman: 'partial', master: 'partial' },
    CA: { journeyman: 'partial', master: 'partial' },
    FL: { journeyman: 'full', master: 'partial' },
    NV: { journeyman: 'partial', master: 'partial' },
    AZ: { journeyman: 'partial', master: 'partial' },
    CO: { journeyman: 'partial', master: 'partial' },
    GA: { journeyman: 'full', master: 'full' },
    VA: { journeyman: 'full', master: 'full' },
    PA: { journeyman: 'partial', master: 'partial' },
    NC: { journeyman: 'full', master: 'full' },
  },
  VA: {
    TX: { journeyman: 'full', master: 'partial' },
    CA: { journeyman: 'partial', master: 'partial' },
    FL: { journeyman: 'full', master: 'full' },
    NV: { journeyman: 'full', master: 'partial' },
    AZ: { journeyman: 'full', master: 'partial' },
    CO: { journeyman: 'partial', master: 'partial' },
    GA: { journeyman: 'full', master: 'full' },
    NC: { journeyman: 'full', master: 'full' },
    PA: { journeyman: 'partial', master: 'partial' },
    VA: { journeyman: 'full', master: 'full' },
  },
  PA: {
    TX: { journeyman: 'none', master: 'none' },
    CA: { journeyman: 'none', master: 'none' },
    FL: { journeyman: 'none', master: 'none' },
    NV: { journeyman: 'none', master: 'none' },
    AZ: { journeyman: 'none', master: 'none' },
    CO: { journeyman: 'none', master: 'none' },
    GA: { journeyman: 'none', master: 'none' },
    NC: { journeyman: 'partial', master: 'partial' },
    VA: { journeyman: 'partial', master: 'partial' },
    PA: { journeyman: 'full', master: 'full' },
  },
};

// Conditions for partial reciprocity rules (maps homeState→targetState→level to requirement IDs)
// We'll look these up by name after seeding requirements
const PARTIAL_CONDITIONS: Record<string, string[]> = {
  // TX → CA: need CA exam + CA bond
  'TX-CA-journeyman': ['CA-electrician-journeyman-exam', 'CA-electrician-journeyman-experience_years'],
  'TX-CA-master': ['CA-electrician-master-exam', 'CA-electrician-contractor-bond'],
  // FL → CA
  'FL-CA-journeyman': ['CA-electrician-journeyman-exam', 'CA-electrician-journeyman-experience_years'],
  'FL-CA-master': ['CA-electrician-master-exam'],
  // TX → CO
  'TX-CO-journeyman': ['CO-electrician-journeyman-exam'],
  'TX-CO-master': ['CO-electrician-master-exam', 'CO-electrician-contractor-bond'],
  // TX → NC
  'TX-NC-journeyman': ['NC-electrician-journeyman-exam'],
  'TX-NC-master': ['NC-electrician-master-exam', 'NC-electrician-contractor-bond'],
  // TX → NV (master partial)
  'TX-NV-master': ['NV-electrician-master-exam'],
  // FL → NV (master partial)
  'FL-NV-master': ['NV-electrician-master-exam'],
  // NV → CA
  'NV-CA-journeyman': ['CA-electrician-journeyman-exam'],
  'NV-CA-master': ['CA-electrician-master-exam'],
  // AZ → CA
  'AZ-CA-journeyman': ['CA-electrician-journeyman-exam'],
  'AZ-CA-master': ['CA-electrician-master-exam'],
  // CO → TX
  'CO-TX-journeyman': ['TX-electrician-journeyman-exam'],
  'CO-TX-master': ['TX-electrician-master-exam'],
  // NC → TX
  'NC-TX-journeyman': ['TX-electrician-journeyman-exam'],
  // NC → PA
  'NC-PA-journeyman': ['PA-electrician-journeyman-exam'],
  'NC-PA-master': ['PA-electrician-master-exam'],
  // VA → PA
  'VA-PA-journeyman': ['PA-electrician-journeyman-exam'],
  'VA-PA-master': ['PA-electrician-master-exam'],
};

// ─── Seed Functions ───────────────────────────────────────────────────────────

async function seedStateRequirements() {
  console.log('Seeding state requirements...');
  let count = 0;
  for (const req of stateRequirementsData) {
    await prisma.stateRequirement.upsert({
      where: {
        stateCode_tradeType_tradeLevel_requirementType_name: {
          stateCode: req.stateCode,
          tradeType: req.tradeType,
          tradeLevel: req.tradeLevel,
          requirementType: req.requirementType,
          name: req.name,
        },
      },
      update: {
        description: req.description,
        feeAmount: req.feeAmount,
        processingDays: req.processingDays,
        formUrl: req.formUrl,
        lastUpdated: req.lastUpdated,
      },
      create: req,
    });
    count++;
  }
  console.log(`  ✓ Seeded ${count} state requirements`);
}

async function seedReciprocityRules() {
  console.log('Seeding reciprocity rules...');
  let count = 0;

  // Build a lookup map for requirement IDs
  const reqRecords = await prisma.stateRequirement.findMany();
  const reqLookup = new Map<string, string>();
  for (const r of reqRecords) {
    const key = `${r.stateCode}-${r.tradeType}-${r.tradeLevel}-${r.requirementType}`;
    reqLookup.set(key, r.id);
  }

  for (const homeState of STATES) {
    for (const targetState of STATES) {
      if (homeState === targetState) continue;

      const pair = RECIPROCITY_MATRIX[homeState][targetState];
      const tradeType = 'electrician';

      for (const tradeLevel of ['journeyman', 'master'] as const) {
        const status = pair[tradeLevel];
        const conditionKey = `${homeState}-${targetState}-${tradeLevel}`;
        let conditionIds: string[] | null = null;

        if (status === 'partial') {
          const conditionNames = PARTIAL_CONDITIONS[conditionKey] ?? [];
          conditionIds = conditionNames
            .map(name => reqLookup.get(name))
            .filter((id): id is string => id !== undefined);
        }

        await prisma.reciprocityRule.upsert({
          where: {
            homeState_targetState_tradeType_tradeLevel: {
              homeState,
              targetState,
              tradeType,
              tradeLevel,
            },
          },
          update: {
            status,
            conditions: conditionIds ?? undefined,
            lastVerified: new Date(),
          },
          create: {
            homeState,
            targetState,
            tradeType,
            tradeLevel,
            status,
            conditions: conditionIds ?? undefined,
            effectiveDate: new Date('2024-01-01'),
            sourceUrl: 'https://www.nascla.org/',
            lastVerified: new Date(),
          },
        });
        count++;
      }
    }
  }
  console.log(`  ✓ Seeded ${count} reciprocity rules`);
}

async function main() {
  console.log('Starting VoltPass seed...');
  await seedStateRequirements();
  await seedReciprocityRules();
  console.log('Seed complete!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
