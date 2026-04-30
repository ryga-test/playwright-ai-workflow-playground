export interface AppProfile {
  name: string;
  baseUrlEnvVar: string;
  authMethod?: string;
  testTags?: string[];
  storageStatePath?: string;
}
