import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../auth/guards/rbac.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { BranchesService } from './branches.service';
import { CreateRegionDto } from './dto/create-region.dto';
import { UpdateRegionDto } from './dto/update-region.dto';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { SetBranchTargetDto } from './dto/set-branch-target.dto';
import { QueryBranchesDto, QueryBranchTargetsDto } from './dto/query-branches.dto';

@ApiTags('Branch Hierarchy & Regional Operations Hubs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // REGION / REGIONAL HUB ENDPOINTS
  // ─────────────────────────────────────────────────────────────────────────────

  @Get('regions')
  @ApiOperation({ summary: 'List all regional hubs with branch rollups' })
  async getRegions(@CurrentUser() user: any) {
    return this.branchesService.getRegions(user);
  }

  @Get('regions/:id')
  @ApiOperation({ summary: 'Get regional hub detail with member branches and metrics' })
  async getRegionById(@Param('id') id: string, @CurrentUser() user: any) {
    return this.branchesService.getRegionById(id, user);
  }

  @Post('regions')
  @ApiOperation({ summary: 'Create new regional operations hub (Admin only)' })
  async createRegion(@Body() dto: CreateRegionDto, @CurrentUser() user: any) {
    return this.branchesService.createRegion(dto, user);
  }

  @Patch('regions/:id')
  @ApiOperation({ summary: 'Update regional operations hub (Admin only)' })
  async updateRegion(
    @Param('id') id: string,
    @Body() dto: UpdateRegionDto,
    @CurrentUser() user: any,
  ) {
    return this.branchesService.updateRegion(id, dto, user);
  }

  @Delete('regions/:id')
  @ApiOperation({ summary: 'Delete regional hub if no active branches exist' })
  async deleteRegion(@Param('id') id: string, @CurrentUser() user: any) {
    return this.branchesService.deleteRegion(id, user);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PERFORMANCE & TARGET MANAGEMENT ENDPOINTS
  // ─────────────────────────────────────────────────────────────────────────────

  @Get('performance')
  @ApiOperation({ summary: 'Get consolidated branch performance matrix and regional rollups' })
  async getPerformanceMatrix(
    @CurrentUser() user: any,
    @Query('targetPeriod') targetPeriod?: string,
  ) {
    return this.branchesService.getPerformanceMatrix(user, targetPeriod || '2026-08');
  }

  @Get('targets')
  @ApiOperation({ summary: 'Query branch targets with attainment percentages and variances' })
  async getBranchTargets(
    @CurrentUser() user: any,
    @Query() query: QueryBranchTargetsDto,
  ) {
    return this.branchesService.getBranchTargets(user, query);
  }

  @Post('targets')
  @ApiOperation({ summary: 'Set or update branch revenue and case targets for a period' })
  async setBranchTarget(
    @Body() dto: SetBranchTargetDto,
    @CurrentUser() user: any,
  ) {
    return this.branchesService.setBranchTarget(dto, user);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // BRANCH DIRECTORY & 360 ENDPOINTS
  // ─────────────────────────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'List operating branches with region, manager, and workload' })
  async getBranches(
    @CurrentUser() user: any,
    @Query() query: QueryBranchesDto,
  ) {
    return this.branchesService.getBranches(user, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get branch 360 overview and metrics' })
  async getBranchById(@Param('id') id: string, @CurrentUser() user: any) {
    return this.branchesService.getBranchById(id, user);
  }

  @Post()
  @ApiOperation({ summary: 'Create new operating branch in organization' })
  async createBranch(@Body() dto: CreateBranchDto, @CurrentUser() user: any) {
    return this.branchesService.createBranch(dto, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update branch configuration and manager' })
  async updateBranch(
    @Param('id') id: string,
    @Body() dto: UpdateBranchDto,
    @CurrentUser() user: any,
  ) {
    return this.branchesService.updateBranch(id, dto, user);
  }
}
