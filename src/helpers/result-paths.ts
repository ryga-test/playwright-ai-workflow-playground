import { join } from 'node:path';

export function getFlowRunRoot(app: string, flowId: string, runId: string): string {
  return join('results', app, 'flows', flowId, runId);
}

export function getStepDir(app: string, flowId: string, runId: string, stepName: string): string {
  return join(getFlowRunRoot(app, flowId, runId), stepName);
}
