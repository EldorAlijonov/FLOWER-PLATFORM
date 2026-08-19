import { z } from 'zod';

export const idSchema = z.string().uuid();

export const phoneSchema = z.string().min(3).max(32);

export const shopNameSchema = z.string().min(2).max(120);
