import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { AppError } from './error-handler';

/**
 * Validation middleware factory
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        return res.status(400).json({
          error: 'Validation failed',
          details: errors,
        });
      }
      next(error);
    }
  };
}

// Common validation schemas

export const opportunitySchema = z.object({
  body: z.object({
    campaignId: z.string().min(1),
    brandId: z.string().min(1),
    title: z.string().min(3).max(200),
    description: z.string().min(10),
    requirements: z.array(z.any()),
    budget: z.number().positive(),
    currency: z.string().length(3).optional(),
    deadline: z.string().or(z.date()),
    targetNiche: z.array(z.string()),
    minFollowers: z.number().optional(),
    maxFollowers: z.number().optional(),
    locations: z.array(z.string()),
    deliverables: z.array(z.any()),
    slots: z.number().positive().optional(),
  }),
});

export const bidSchema = z.object({
  body: z.object({
    opportunityId: z.string().min(1),
    creatorId: z.string().min(1),
    proposedRate: z.number().positive(),
    currency: z.string().length(3).optional(),
    pitch: z.string().min(50),
    portfolioItems: z.array(z.any()),
    estimatedDays: z.number().positive().optional(),
    additionalNotes: z.string().optional(),
  }),
});

export const contractSchema = z.object({
  body: z.object({
    opportunityId: z.string().min(1),
    creatorId: z.string().min(1),
    brandId: z.string().min(1),
    terms: z.any(),
    paymentTerms: z.any(),
    totalAmount: z.number().positive(),
    currency: z.string().length(3).optional(),
    deliverables: z.array(z.any()),
    startDate: z.string().or(z.date()),
    endDate: z.string().or(z.date()),
  }),
});

export const payoutSchema = z.object({
  body: z.object({
    creatorId: z.string().min(1),
    amount: z.number().positive(),
    currency: z.string().length(3),
    contractId: z.string().optional(),
    method: z.enum(['BANK_TRANSFER', 'PAYPAL', 'STRIPE_CONNECT', 'PAYSTACK', 'FLUTTERWAVE', 'MOBILE_MONEY']),
    description: z.string().optional(),
  }),
});

export const disputeSchema = z.object({
  body: z.object({
    contractId: z.string().min(1),
    raisedBy: z.string().min(1),
    raisedByRole: z.enum(['CREATOR', 'BRAND', 'ADMIN']),
    reason: z.string().min(10),
    description: z.string().min(50),
    evidence: z.array(z.any()).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  }),
});

export const ambassadorProgramSchema = z.object({
  body: z.object({
    brandId: z.string().min(1),
    name: z.string().min(3).max(200),
    description: z.string().min(10),
    tiers: z.array(z.any()),
    benefits: z.any(),
    requirements: z.any(),
    commissionRate: z.number().min(0).max(100).optional(),
    paymentSchedule: z.string().optional(),
    isPublic: z.boolean().optional(),
    maxAmbassadors: z.number().positive().optional(),
  }),
});

export default {
  validate,
  opportunitySchema,
  bidSchema,
  contractSchema,
  payoutSchema,
  disputeSchema,
  ambassadorProgramSchema,
};
