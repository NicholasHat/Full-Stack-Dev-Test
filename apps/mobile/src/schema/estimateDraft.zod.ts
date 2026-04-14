import { z } from 'zod';

// Zod schema for validating the structure of an estimate draft.

export const estimateDraftSchema = z.object({
  jobId: z.string().optional().nullable(),
  customerId: z.string().optional().nullable(),
  labor: z
    .object({
      jobType: z.string().optional().nullable(),
      level: z.string().optional().nullable(),
      hoursChosen: z.number().nonnegative().optional().nullable(),
    })
    .optional()
    .nullable(),
  equipmentLines: z
    .array(
      z.object({
        equipmentId: z.string().optional().nullable(),
        freeText: z.string().optional().nullable(),
        qty: z.number().positive(),
      })
    )
    .default([]),
  adjustments: z.array(z.object({ code: z.string() })).default([]),
  specialNotes: z.string().optional().nullable(),
  missingRequiredFields: z.array(z.string()).default([]),
});

export type EstimateDraft = z.infer<typeof estimateDraftSchema>;
