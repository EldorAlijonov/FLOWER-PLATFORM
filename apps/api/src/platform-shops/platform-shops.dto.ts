import { z } from 'zod';

export const shopPlanValues = ['START', 'BUSINESS', 'PRO'] as const;

export const createPlatformShopSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Do'kon nomini kiriting.")
    .max(120, "Do'kon nomi 120 belgidan oshmasin."),
  ownerName: z
    .string()
    .trim()
    .min(1, 'Egasi ismini kiriting.')
    .max(120, 'Egasi ismi 120 belgidan oshmasin.'),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s()-]{7,20}$/, "Telefon raqami noto'g'ri."),
  login: z.string().trim().min(1, 'Login kiriting.').max(64, 'Login 64 belgidan oshmasin.'),
  plan: z.enum(shopPlanValues).default('START'),
});

export type CreatePlatformShopInput = z.infer<typeof createPlatformShopSchema>;

export const updatePlatformShopSchema = createPlatformShopSchema
  .omit({ login: true })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Kamida bitta maydonni o'zgartiring.",
  });

export type UpdatePlatformShopInput = z.infer<typeof updatePlatformShopSchema>;

export function zodFieldErrors(error: z.ZodError) {
  const flattened = error.flatten().fieldErrors;
  const errors: Record<string, string> = {};

  for (const [field, messages] of Object.entries(flattened)) {
    if (messages?.[0]) {
      errors[field] = messages[0];
    }
  }

  return errors;
}
