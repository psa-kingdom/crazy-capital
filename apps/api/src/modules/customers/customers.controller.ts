import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import {
  CreateCustomerDto,
  CustomerAddressInputDto,
  CustomerContactInputDto,
} from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { ConvertLeadDto } from './dto/convert-lead.dto';
import { QueryCustomersDto } from './dto/query-customers.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { JwtPayload } from '@cc/types';

@ApiTags('Customer 360')
@ApiBearerAuth('bearer')
@Controller()
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post('leads/:id/convert')
  @RequirePermissions('customer.create')
  @ApiOperation({
    summary: 'Atomic Lead-to-Customer conversion transaction (Vertical Slice 1.3)',
    description: 'Converts a qualified lead into a master customer profile, sets lead.status to CONVERTED, creates address/contact, and logs activity atomically.',
  })
  @ApiResponse({ status: 201, description: 'Lead converted to customer successfully' })
  async convertLead(
    @Param('id') leadId: string,
    @Body() dto: ConvertLeadDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const userContext = {
      id: user.sub,
      organizationId: user.organizationId,
      branchId: user.branchId,
      roles: user.roles,
    };
    return this.customersService.convertLead(leadId, dto, userContext);
  }

  @Post('customers')
  @RequirePermissions('customer.create')
  @ApiOperation({ summary: 'Create new customer directly' })
  @ApiResponse({ status: 201, description: 'Customer created successfully' })
  async create(
    @Body() dto: CreateCustomerDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const userContext = {
      id: user.sub,
      organizationId: user.organizationId,
      branchId: user.branchId,
      roles: user.roles,
    };
    return this.customersService.create(dto, userContext);
  }

  @Get('customers')
  @RequirePermissions('customer.view')
  @ApiOperation({
    summary: 'Get paginated list of customers',
    description: 'Filter customers by type, branch, status, or search across PAN, GSTIN, mobile, name, email.',
  })
  @ApiResponse({ status: 200, description: 'Paginated customer records' })
  async findAll(
    @Query() query: QueryCustomersDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const userContext = {
      id: user.sub,
      organizationId: user.organizationId,
      branchId: user.branchId,
      roles: user.roles,
    };
    return this.customersService.findAll(query, userContext);
  }

  @Get('customers/:id')
  @RequirePermissions('customer.view')
  @ApiOperation({
    summary: 'Get unified Customer 360 profile',
    description: 'Returns master customer data, registered addresses, contacts, linked service applications, documents, and billing history.',
  })
  @ApiResponse({ status: 200, description: 'Complete Customer 360 object' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const userContext = {
      id: user.sub,
      organizationId: user.organizationId,
      branchId: user.branchId,
      roles: user.roles,
    };
    return this.customersService.findOne(id, userContext);
  }

  @Patch('customers/:id')
  @RequirePermissions('customer.update')
  @ApiOperation({ summary: 'Update customer master profile' })
  @ApiResponse({ status: 200, description: 'Updated customer profile' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const userContext = {
      id: user.sub,
      organizationId: user.organizationId,
      branchId: user.branchId,
      roles: user.roles,
    };
    return this.customersService.update(id, dto, userContext);
  }

  @Post('customers/:id/addresses')
  @RequirePermissions('customer.update')
  @ApiOperation({ summary: 'Add an address to customer' })
  @ApiResponse({ status: 201, description: 'Address created' })
  async addAddress(
    @Param('id') id: string,
    @Body() dto: CustomerAddressInputDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const userContext = {
      id: user.sub,
      organizationId: user.organizationId,
      branchId: user.branchId,
      roles: user.roles,
    };
    return this.customersService.addAddress(id, dto, userContext);
  }

  @Post('customers/:id/contacts')
  @RequirePermissions('customer.update')
  @ApiOperation({ summary: 'Add a contact person to customer' })
  @ApiResponse({ status: 201, description: 'Contact created' })
  async addContact(
    @Param('id') id: string,
    @Body() dto: CustomerContactInputDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const userContext = {
      id: user.sub,
      organizationId: user.organizationId,
      branchId: user.branchId,
      roles: user.roles,
    };
    return this.customersService.addContact(id, dto, userContext);
  }
}
