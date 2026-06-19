/**
 * cn.ts — className combiner. clsx for conditional joins + tailwind-merge to dedupe
 * conflicting Tailwind utilities (last wins). Single helper used by every UI
 * primitive and feature component.
 */
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
