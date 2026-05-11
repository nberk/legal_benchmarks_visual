import { z } from "zod";

export const WorkTypeSchema = z.enum(["analyze", "draft", "review", "research"]);

export const CriterionSchema = z.object({
  id: z.string(),
  title: z.string(),
  deliverables: z.array(z.string()),
  match_criteria: z.string(),
});

export const TaskJsonSchema = z.object({
  title: z.string(),
  work_type: WorkTypeSchema,
  tags: z.array(z.string()),
  instructions: z.string(),
  deliverables: z.record(z.string(), z.string()),
  criteria: z.array(CriterionSchema),
});

export type TaskJson = z.infer<typeof TaskJsonSchema>;
