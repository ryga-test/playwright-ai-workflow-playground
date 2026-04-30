import { load } from 'js-yaml';

export interface InteractiveElement {
  role: string;
  name: string;
  description?: string;
}

const INTERACTIVE_ROLES = new Set([
  'button',
  'textbox',
  'searchbox',
  'checkbox',
  'radio',
  'combobox',
  'link',
  'cell',
  'columnheader',
  'rowheader',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseRoleKey(key: string): InteractiveElement | null {
  const match = key.match(/^(?<role>[a-zA-Z-]+)(?:\s+[\"'](?<name>.*?)[\"'])?$/);
  if (!match?.groups) {
    return null;
  }

  const role = match.groups.role.toLowerCase();
  if (!INTERACTIVE_ROLES.has(role)) {
    return null;
  }

  return {
    role,
    name: match.groups.name ?? '',
  };
}

function collectElements(value: unknown, elements: InteractiveElement[]): void {
  if (typeof value === 'string') {
    const parsed = parseRoleKey(value.trim());
    if (parsed) {
      elements.push(parsed);
    }
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectElements(item, elements);
    }
    return;
  }

  if (isRecord(value)) {
    for (const [key, child] of Object.entries(value)) {
      const parsed = parseRoleKey(key.trim());
      if (parsed) {
        const description = typeof child === 'string' ? child : undefined;
        elements.push(description ? { ...parsed, description } : parsed);
      }
      collectElements(child, elements);
    }
  }
}

export function parseSnapshot(yamlContent: string): InteractiveElement[] {
  const parsed = load(yamlContent);
  const elements: InteractiveElement[] = [];
  collectElements(parsed, elements);
  return elements;
}
