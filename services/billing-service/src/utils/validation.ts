import Joi from 'joi';
import { PlanName, UsageType } from '.prisma/billing-service-client';

export const subscriptionSchema = Joi.object({
  planName: Joi.string()
    .valid(...Object.values(PlanName))
    .required(),
  email: Joi.string().email().required(),
  name: Joi.string().optional(),
  paymentMethodId: Joi.string().optional(),
});

export const upgradeSchema = Joi.object({
  planName: Joi.string()
    .valid(...Object.values(PlanName))
    .required(),
});

export const cancelSchema = Joi.object({
  cancelAtPeriodEnd: Joi.boolean().default(true),
});

export const usageRecordSchema = Joi.object({
  subscriptionId: Joi.string().uuid().required(),
  type: Joi.string()
    .valid(...Object.values(UsageType))
    .required(),
  quantity: Joi.number().positive().required(),
  unit: Joi.string().default('unit'),
  description: Joi.string().optional(),
  metadata: Joi.object().optional(),
});

export const invoiceQuerySchema = Joi.object({
  status: Joi.string()
    .valid('DRAFT', 'OPEN', 'PAID', 'UNCOLLECTIBLE', 'VOID')
    .optional(),
  limit: Joi.number().integer().min(1).max(100).default(10),
  offset: Joi.number().integer().min(0).default(0),
});

export const paymentMethodSchema = Joi.object({
  paymentMethodId: Joi.string().required(),
});

export const usageQuerySchema = Joi.object({
  type: Joi.string()
    .valid(...Object.values(UsageType))
    .optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
});

export const validate = (schema: Joi.ObjectSchema, data: any) => {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errors = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));

    throw {
      status: 400,
      name: 'ValidationError',
      message: 'Validation failed',
      errors,
    };
  }

  return value;
};
