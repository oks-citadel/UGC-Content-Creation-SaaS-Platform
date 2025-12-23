import axios from 'axios';
import pino from 'pino';

const logger = pino({ name: 'workflow-actions' });

export interface Action {
  execute(parameters: any, context: any): Promise<any>;
}

class HttpRequestAction implements Action {
  async execute(params: any, context: any): Promise<any> {
    const { method = 'GET', url, headers, body } = params;
    const response = await axios({ method, url, headers, data: body });
    return { status: response.status, data: response.data, headers: response.headers };
  }
}

class TransformDataAction implements Action {
  async execute(params: any, context: any): Promise<any> {
    const { expression } = params;
    const func = new Function('context', `with(context) { return ${expression} }`);
    return func(context);
  }
}

class ConditionalAction implements Action {
  async execute(params: any, context: any): Promise<any> {
    const { condition, trueValue, falseValue } = params;
    const func = new Function('context', `with(context) { return ${condition} }`);
    return func(context) ? trueValue : falseValue;
  }
}

class DelayAction implements Action {
  async execute(params: any): Promise<any> {
    const { milliseconds } = params;
    await new Promise(resolve => setTimeout(resolve, milliseconds));
    return { delayed: milliseconds };
  }
}

class LogAction implements Action {
  async execute(params: any, context: any): Promise<any> {
    const { message, level = 'info' } = params;
    (logger as any)[level](message);
    return { logged: message };
  }
}

export const actions: Record<string, Action> = {
  'http.request': new HttpRequestAction(),
  'data.transform': new TransformDataAction(),
  'flow.conditional': new ConditionalAction(),
  'flow.delay': new DelayAction(),
  'utils.log': new LogAction(),
};
