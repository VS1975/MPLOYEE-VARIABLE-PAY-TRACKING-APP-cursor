import { z } from "zod";

export const submitFormSchema = z.object({
  employee_id: z.string().trim().min(1).max(64),
  employee_name: z.string().trim().min(1).max(120),
  work_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  rack_count: z.coerce.number().int().min(0).max(50000),
  work_type: z.string().trim().max(120).optional().nullable(),
  before_captured_at: z.string().min(8),
  after_captured_at: z.string().min(8),
});
