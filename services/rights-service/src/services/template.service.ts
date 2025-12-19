import { v4 as uuidv4 } from 'uuid';
import Handlebars from 'handlebars';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/error-handler';

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'currency';
  required: boolean;
  defaultValue?: any;
}

export interface RightsTemplate {
  id: string;
  brandId?: string; // null for system templates
  name: string;
  description?: string;
  type: 'standard' | 'exclusive' | 'royalty' | 'custom';
  content: string;
  variables?: TemplateVariable[];
  isDefault: boolean;
  isSystem: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateParams {
  name: string;
  description?: string;
  type: 'standard' | 'exclusive' | 'royalty' | 'custom';
  content: string;
  variables?: TemplateVariable[];
  isDefault?: boolean;
}

export class TemplateService {
  private templates: Map<string, RightsTemplate> = new Map();

  constructor() {
    this.initializeSystemTemplates();
  }

  private initializeSystemTemplates() {
    // Standard non-exclusive license
    const standardTemplate: RightsTemplate = {
      id: uuidv4(),
      name: 'Standard Non-Exclusive License',
      description: 'Standard license for non-exclusive usage rights',
      type: 'standard',
      content: `
CONTENT LICENSE AGREEMENT

This Content License Agreement ("Agreement") is entered into as of {{effectiveDate}} between:

Creator: {{creatorName}} ("Creator")
Brand: {{brandName}} ("Brand")

1. GRANT OF LICENSE
Creator hereby grants to Brand a non-exclusive license to use the Content identified as {{contentId}}
for the following purposes:
- Platforms: {{platforms}}
- Territories: {{territories}}
- Duration: {{duration}}

2. COMPENSATION
Brand agrees to pay Creator {{compensation}} for the rights granted herein.

3. MODIFICATIONS
{{#if modificationsAllowed}}
Brand may make reasonable modifications to the Content for the purposes outlined above.
{{else}}
Brand may not modify the Content without prior written consent from Creator.
{{/if}}

4. ATTRIBUTION
{{#if attributionRequired}}
Brand shall provide appropriate attribution to Creator when using the Content.
{{else}}
No attribution is required.
{{/if}}

5. TERMINATION
This Agreement shall terminate upon expiration of the license period or upon written notice by either party.

Signatures:
Creator: _________________________ Date: _____________
Brand: _________________________ Date: _____________
`,
      variables: [
        { name: 'effectiveDate', type: 'date', required: true },
        { name: 'creatorName', type: 'string', required: true },
        { name: 'brandName', type: 'string', required: true },
        { name: 'contentId', type: 'string', required: true },
        { name: 'platforms', type: 'string', required: true },
        { name: 'territories', type: 'string', required: true },
        { name: 'duration', type: 'string', required: true },
        { name: 'compensation', type: 'currency', required: true },
        { name: 'modificationsAllowed', type: 'boolean', required: false, defaultValue: false },
        { name: 'attributionRequired', type: 'boolean', required: false, defaultValue: true },
      ],
      isDefault: true,
      isSystem: true,
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Exclusive license template
    const exclusiveTemplate: RightsTemplate = {
      id: uuidv4(),
      name: 'Exclusive License',
      description: 'Template for exclusive content licensing',
      type: 'exclusive',
      content: `
EXCLUSIVE CONTENT LICENSE AGREEMENT

This Exclusive Content License Agreement ("Agreement") grants {{brandName}} exclusive rights to the Content.

EXCLUSIVITY CLAUSE
Creator agrees not to license, sell, or otherwise distribute the Content to any third party during the term of this Agreement.

{{> standardTerms}}
`,
      isDefault: false,
      isSystem: true,
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Royalty-based license template
    const royaltyTemplate: RightsTemplate = {
      id: uuidv4(),
      name: 'Royalty-Based License',
      description: 'Template for royalty-based compensation',
      type: 'royalty',
      content: `
ROYALTY-BASED CONTENT LICENSE AGREEMENT

COMPENSATION TERMS
Creator shall receive {{royaltyPercent}}% of net revenue generated from use of the Content.

Minimum Guarantee: {{minimumGuarantee}}
Payment Schedule: {{paymentSchedule}}

Reporting: Brand shall provide Creator with monthly usage reports.

{{> standardTerms}}
`,
      variables: [
        { name: 'royaltyPercent', type: 'number', required: true },
        { name: 'minimumGuarantee', type: 'currency', required: false, defaultValue: 0 },
        { name: 'paymentSchedule', type: 'string', required: true, defaultValue: 'Monthly' },
      ],
      isDefault: false,
      isSystem: true,
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.templates.set(standardTemplate.id, standardTemplate);
    this.templates.set(exclusiveTemplate.id, exclusiveTemplate);
    this.templates.set(royaltyTemplate.id, royaltyTemplate);

    logger.info('System templates initialized');
  }

  async listTemplates(type?: string): Promise<RightsTemplate[]> {
    let templates = Array.from(this.templates.values());

    if (type) {
      templates = templates.filter(t => t.type === type);
    }

    return templates.sort((a, b) => {
      // System templates first, then by name
      if (a.isSystem !== b.isSystem) return a.isSystem ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }

  async getTemplate(templateId: string): Promise<RightsTemplate> {
    const template = this.templates.get(templateId);

    if (!template) {
      throw new AppError('Template not found', 404, 'TEMPLATE_NOT_FOUND');
    }

    return template;
  }

  async createTemplate(brandId: string, params: CreateTemplateParams): Promise<RightsTemplate> {
    // Check for duplicate name within brand
    const existing = Array.from(this.templates.values())
      .find(t => t.brandId === brandId && t.name === params.name);

    if (existing) {
      throw new AppError('Template with this name already exists', 400, 'DUPLICATE_TEMPLATE');
    }

    const template: RightsTemplate = {
      id: uuidv4(),
      brandId,
      name: params.name,
      description: params.description,
      type: params.type,
      content: params.content,
      variables: params.variables,
      isDefault: params.isDefault || false,
      isSystem: false,
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.templates.set(template.id, template);
    logger.info({ templateId: template.id, brandId }, 'Template created');

    return template;
  }

  async updateTemplate(templateId: string, updates: Partial<CreateTemplateParams>): Promise<RightsTemplate> {
    const template = this.templates.get(templateId);

    if (!template) {
      throw new AppError('Template not found', 404, 'TEMPLATE_NOT_FOUND');
    }

    if (template.isSystem) {
      throw new AppError('Cannot modify system templates', 400, 'SYSTEM_TEMPLATE');
    }

    if (updates.name) template.name = updates.name;
    if (updates.description !== undefined) template.description = updates.description;
    if (updates.type) template.type = updates.type;
    if (updates.content) template.content = updates.content;
    if (updates.variables) template.variables = updates.variables;
    if (updates.isDefault !== undefined) template.isDefault = updates.isDefault;

    template.updatedAt = new Date().toISOString();
    this.templates.set(templateId, template);

    logger.info({ templateId }, 'Template updated');
    return template;
  }

  async deleteTemplate(templateId: string): Promise<void> {
    const template = this.templates.get(templateId);

    if (!template) {
      throw new AppError('Template not found', 404, 'TEMPLATE_NOT_FOUND');
    }

    if (template.isSystem) {
      throw new AppError('Cannot delete system templates', 400, 'SYSTEM_TEMPLATE');
    }

    this.templates.delete(templateId);
    logger.info({ templateId }, 'Template deleted');
  }

  async previewTemplate(templateId: string, variables: Record<string, any>): Promise<string> {
    const template = await this.getTemplate(templateId);

    try {
      const compiled = Handlebars.compile(template.content);
      return compiled(variables);
    } catch (error) {
      logger.error({ error, templateId }, 'Failed to compile template');
      throw new AppError('Failed to render template', 400, 'TEMPLATE_ERROR');
    }
  }

  async incrementUsageCount(templateId: string): Promise<void> {
    const template = this.templates.get(templateId);
    if (template) {
      template.usageCount++;
      this.templates.set(templateId, template);
    }
  }
}
