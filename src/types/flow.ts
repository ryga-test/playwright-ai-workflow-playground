export type FlowVersion = '1.0';
export type SideEffects = 'none' | 'reversible' | 'destructive';

export interface FlowAuth {
  required: boolean;
}

export interface FlowDefinition {
  version: FlowVersion;
  id: string;
  name: string;
  goal: string;
  startPath?: string;
  tags?: string[];
  auth: FlowAuth;
  sideEffects: SideEffects;
  allowedActions: string[];
  forbiddenActions: string[];
  successCriteria: string[];
  outOfScope?: string[];
  knowledgeRefs?: string[];
  notes?: string;
  testData?: Record<string, unknown>;
}

export interface ResolvedFlow extends FlowDefinition {
  sourceFile: string;
  mergedTags: string[];
  effectiveForbiddenActions: string[];
}
