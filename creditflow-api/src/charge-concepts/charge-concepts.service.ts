import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateChargeConceptDto } from './dto/create-charge-concept.dto';
import { UpdateChargeConceptDto } from './dto/update-charge-concept.dto';

@Injectable()
export class ChargeConceptsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, createChargeConceptDto: CreateChargeConceptDto) {
    return this.prisma.chargeConcept.create({
      data: { ...createChargeConceptDto, tenantId },
    });
  }

  async findAll(tenantId: string, onlyActive: boolean = true) {
    return this.prisma.chargeConcept.findMany({
      where: { tenantId, ...(onlyActive ? { active: true } : {}) },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(tenantId: string, id: number) {
    const concept = await this.prisma.chargeConcept.findFirst({
      where: { id, tenantId },
    });

    if (!concept) {
      throw new NotFoundException(`Charge concept with ID ${id} not found`);
    }

    return concept;
  }

  async update(tenantId: string, id: number, updateChargeConceptDto: UpdateChargeConceptDto) {
    await this.findOne(tenantId, id);

    return this.prisma.chargeConcept.update({
      where: { id },
      data: updateChargeConceptDto,
    });
  }

  async remove(tenantId: string, id: number) {
    await this.findOne(tenantId, id);

    return this.prisma.chargeConcept.update({
      where: { id },
      data: { active: false },
    });
  }

  async calculateDiscounts(tenantId: string, loanAmount: number, discountConcepts: any[]) {
    let totalDiscounts = 0;
    const calculatedDiscounts: Array<{
      conceptId: number;
      discountAmount: number;
      percentage: number;
    }> = [];

    for (const discount of discountConcepts) {
      const concept = await this.prisma.chargeConcept.findFirst({
        where: { id: discount.conceptId, tenantId, active: true },
      });

      if (!concept) {
        throw new NotFoundException(
          `Charge concept with ID ${discount.conceptId} not found or inactive`,
        );
      }

      let discountAmount: number;
      let percentage: number;

      if (discount.fixedAmount !== undefined && discount.fixedAmount !== null) {
        discountAmount = discount.fixedAmount;
        percentage = (discountAmount / loanAmount) * 100;
      } else {
        percentage = discount.percentage || Number(concept.percentage);
        discountAmount = loanAmount * (percentage / 100);
      }

      totalDiscounts += discountAmount;

      calculatedDiscounts.push({
        conceptId: discount.conceptId,
        discountAmount,
        percentage,
      });
    }

    return {
      totalDiscounts,
      calculatedDiscounts,
      receivedAmount: loanAmount - totalDiscounts,
    };
  }

  async calculateCosts(tenantId: string, loanAmount: number, costConcepts: any[]) {
    let totalCosts = 0;
    const calculatedCosts: Array<{
      conceptId: number;
      costAmount: number;
      percentage: number;
    }> = [];

    for (const cost of costConcepts) {
      const concept = await this.prisma.chargeConcept.findFirst({
        where: { id: cost.conceptId, tenantId, active: true },
      });

      if (!concept) {
        throw new NotFoundException(
          `Charge concept with ID ${cost.conceptId} not found or inactive`,
        );
      }

      let costAmount: number;
      let percentage: number;

      if (cost.fixedAmount !== undefined && cost.fixedAmount !== null) {
        costAmount = cost.fixedAmount;
        percentage = (costAmount / loanAmount) * 100;
      } else {
        percentage = cost.percentage || Number(concept.percentage);
        costAmount = loanAmount * (percentage / 100);
      }

      totalCosts += costAmount;

      calculatedCosts.push({
        conceptId: cost.conceptId,
        costAmount,
        percentage,
      });
    }

    return {
      totalCosts,
      calculatedCosts,
    };
  }
}
