import { TriggerType } from '.prisma/workflow-client';

export interface Trigger {
  type: TriggerType;
  validate(config: any): boolean;
  setup(workflowId: string, config: any): Promise<void>;
  teardown(workflowId: string): Promise<void>;
}

class ManualTrigger implements Trigger {
  type = TriggerType.MANUAL;
  validate() { return true; }
  async setup() {}
  async teardown() {}
}

class ScheduleTrigger implements Trigger {
  type = TriggerType.SCHEDULE;
  validate(config: any) { return !!config.cronExpression; }
  async setup() {}
  async teardown() {}
}

class WebhookTrigger implements Trigger {
  type = TriggerType.WEBHOOK;
  validate(config: any) { return !!config.path; }
  async setup() {}
  async teardown() {}
}

class EventTrigger implements Trigger {
  type = TriggerType.EVENT;
  validate(config: any) { return !!config.eventType; }
  async setup() {}
  async teardown() {}
}

export const triggers: Record<TriggerType, Trigger> = {
  [TriggerType.MANUAL]: new ManualTrigger(),
  [TriggerType.SCHEDULE]: new ScheduleTrigger(),
  [TriggerType.WEBHOOK]: new WebhookTrigger(),
  [TriggerType.EVENT]: new EventTrigger(),
  [TriggerType.EMAIL]: new ManualTrigger(),
  [TriggerType.DATABASE]: new ManualTrigger(),
};
