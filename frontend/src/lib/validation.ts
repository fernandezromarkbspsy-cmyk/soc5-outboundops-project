import { z } from 'zod';

export const optionalText = z.preprocess(value => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}, z.string().nullable());

export function requiredText(label: string, max = 120) {
  return z.string().trim().min(1, `${label} is required.`).max(max, `${label} must be ${max} characters or fewer.`);
}

export function numberFromInput(label: string) {
  return z.coerce.number({ error: `${label} must be a number.` }).min(0, `${label} cannot be negative.`);
}

export function firstError(errors: Record<string, unknown>) {
  const [first] = Object.values(errors);
  if (first && typeof first === 'object' && 'message' in first && typeof first.message === 'string') {
    return first.message;
  }
  return '';
}
