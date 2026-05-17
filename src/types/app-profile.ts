export interface AppProfile {
  name: string;
  baseUrlEnvVar: string;
  authMethod?: string;
  runner?: 'native' | 'docker';
  testTags?: string[];
  storageStatePath?: string;
}
