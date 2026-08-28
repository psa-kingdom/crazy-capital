import { Injectable, Logger } from '@nestjs/common';
import { McaCompanyLookupDto } from '@cc/types';

@Injectable()
export class McaV3Provider {
  private readonly logger = new Logger(McaV3Provider.name);

  /**
   * Search MCA V3 Registry for company/LLP details or check name availability
   */
  async searchCompanyOrCheckName(searchQuery: string, checkAvailability: boolean): Promise<McaCompanyLookupDto> {
    const startTime = Date.now();
    const queryUpper = searchQuery.toUpperCase().trim();

    // Check if query looks like a CIN (e.g. U72200DL2023PTC123456)
    const isCin = /^[L|U][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/.test(queryUpper);

    // Mock dataset of registered entities for deterministic testing
    const registeredDatabase = [
      {
        cin: 'U72900DL2024PTC412345',
        companyName: 'CRAZY CAPITAL FINTECH PRIVATE LIMITED',
        rocCode: 'ROC-DELHI',
        registrationNumber: '412345',
        companyCategory: 'Company limited by Shares',
        companyClass: 'Private',
        authorizedCapital: 1000000,
        paidUpCapital: 100000,
        dateOfIncorporation: '2024-03-15',
        registeredAddress: 'Plot 42, Sector 62, Noida, Uttar Pradesh, 201301',
        email: 'compliance@crazycapital.in',
        status: 'ACTIVE',
        directors: [
          { din: '09876543', name: 'SAVAG KINGDOM', appointmentDate: '2024-03-15', designation: 'Director' },
          { din: '01234567', name: 'RAJESH SHARMA', appointmentDate: '2024-03-15', designation: 'Managing Director' },
        ],
      },
      {
        cin: 'U65999MH2021PTC356789',
        companyName: 'ZENITH WEALTH MANAGEMENT PRIVATE LIMITED',
        rocCode: 'ROC-MUMBAI',
        registrationNumber: '356789',
        companyCategory: 'Company limited by Shares',
        companyClass: 'Private',
        authorizedCapital: 5000000,
        paidUpCapital: 2500000,
        dateOfIncorporation: '2021-08-20',
        registeredAddress: 'Level 14, Bandra Kurla Complex, Mumbai, 400051',
        email: 'info@zenithwealth.com',
        status: 'ACTIVE',
        directors: [
          { din: '08765432', name: 'ANANYA DESHMUKH', appointmentDate: '2021-08-20', designation: 'Director' },
        ],
      },
    ];

    const existingMatch = registeredDatabase.find(
      (c) => c.companyName.includes(queryUpper) || c.cin === queryUpper,
    );

    if (existingMatch) {
      return {
        ...existingMatch,
        nameAvailabilityCheck: {
          isAvailable: false,
          similarityScore: 1.0,
          phoneticConflicts: [existingMatch.companyName],
          trademarkConflicts: ['Class 36 (Financial Services)'],
          suggestedAlternatives: [
            `${queryUpper} ADVISORY SERVICES PRIVATE LIMITED`,
            `${queryUpper} ENTERPRISES PRIVATE LIMITED`,
            `${queryUpper} VENTURES PRIVATE LIMITED`,
          ],
        },
      };
    }

    // If company not found, simulate MCA Name Reservation (SPICe+ Part A) check
    const isNameAvailable = !['RELIANCE', 'TATA', 'INFOSYS', 'HDFC', 'ICICI'].some((banned) =>
      queryUpper.includes(banned),
    );

    const generatedCin = `U${Math.floor(10000 + Math.random() * 89999)}DL2026PTC${Math.floor(100000 + Math.random() * 899999)}`;

    return {
      cin: isNameAvailable ? generatedCin : 'UNASSIGNED',
      companyName: queryUpper.endsWith('LIMITED') ? queryUpper : `${queryUpper} PRIVATE LIMITED`,
      rocCode: 'ROC-DELHI',
      registrationNumber: `${Math.floor(100000 + Math.random() * 899999)}`,
      companyCategory: 'Company limited by Shares',
      companyClass: 'Private',
      authorizedCapital: 1000000,
      paidUpCapital: 100000,
      dateOfIncorporation: new Date().toISOString().split('T')[0],
      registeredAddress: 'Proposed Registered Address: New Delhi, India',
      email: `compliance@${queryUpper.toLowerCase().replace(/[^a-z0-9]/g, '')}.in`,
      status: isNameAvailable ? 'PROPOSED' : 'RESERVED_OR_PROHIBITED',
      directors: [],
      nameAvailabilityCheck: {
        isAvailable: isNameAvailable,
        similarityScore: isNameAvailable ? 0.15 : 0.95,
        phoneticConflicts: isNameAvailable ? [] : [`Exact conflict with statutory prohibited mark`],
        trademarkConflicts: isNameAvailable ? [] : ['Conflicting Trademark Registry Entry'],
        suggestedAlternatives: [
          `${queryUpper} CAPITAL ADVISORS PRIVATE LIMITED`,
          `${queryUpper} TECH SOLUTIONS PRIVATE LIMITED`,
          `${queryUpper} INDIA PRIVATE LIMITED`,
        ],
      },
    };
  }
}
