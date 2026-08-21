import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateDocumentTypeDto } from './dto/create-document-type.dto';

@Injectable()
export class DocumentTypesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.documentType.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const docType = await this.prisma.documentType.findUnique({
      where: { id },
    });
    if (!docType) {
      throw new NotFoundException(`DocumentType '${id}' not found`);
    }
    return docType;
  }

  async findByCode(code: string) {
    const docType = await this.prisma.documentType.findUnique({
      where: { code: code.toUpperCase() },
    });
    if (!docType) {
      throw new NotFoundException(`DocumentType with code '${code}' not found`);
    }
    return docType;
  }

  async create(dto: CreateDocumentTypeDto) {
    const existing = await this.prisma.documentType.findUnique({
      where: { code: dto.code.toUpperCase() },
    });

    if (existing) {
      throw new ConflictException(`DocumentType with code '${dto.code}' already exists`);
    }

    return this.prisma.documentType.create({
      data: {
        name: dto.name,
        code: dto.code.toUpperCase(),
        description: dto.description,
      },
    });
  }

  async seedDefaults() {
    const defaultTypes = [
      { code: 'PAN', name: 'PAN Card', description: 'Permanent Account Number of director or proprietor' },
      { code: 'AADHAAR', name: 'Aadhaar Card', description: 'Aadhaar identity card of all directors/partners' },
      { code: 'PASSPORT', name: 'Passport', description: 'Valid passport copy for identification' },
      { code: 'VOTER_ID', name: 'Voter ID', description: 'Election Commission voter identity card' },
      { code: 'DRIVING_LICENSE', name: 'Driving License', description: 'State driving license' },
      { code: 'BANK_STATEMENT', name: 'Bank Statement', description: 'Last 3-6 months bank statement with bank stamp' },
      { code: 'ELECTRICITY_BILL', name: 'Electricity Bill', description: 'Utility bill not older than 2 months for address proof' },
      { code: 'RENT_AGREEMENT', name: 'Rent Agreement', description: 'Registered lease agreement for registered office address' },
      { code: 'NOC_LANDLORD', name: 'No Objection Certificate (NOC)', description: 'NOC from property owner for registered office' },
      { code: 'GST_CERTIFICATE', name: 'GST Registration Certificate', description: 'Form GST REG-06 certificate' },
      { code: 'ITR_V', name: 'ITR-V Acknowledgement', description: 'Income Tax Return verification form' },
      { code: 'MOA_AOA', name: 'MOA & AOA', description: 'Memorandum and Articles of Association' },
      { code: 'INCORPORATION_CERT', name: 'Certificate of Incorporation', description: 'MCA Certificate of Incorporation' },
      { code: 'DSC_TOKEN', name: 'Digital Signature (DSC)', description: 'Class 3 Digital Signature Certificate' },
      { code: 'MSME_UDYAM', name: 'Udyam Registration Certificate', description: 'MSME Udyam registration certificate' },
    ];

    for (const docType of defaultTypes) {
      await this.prisma.documentType.upsert({
        where: { code: docType.code },
        update: {},
        create: docType,
      });
    }
  }
}
