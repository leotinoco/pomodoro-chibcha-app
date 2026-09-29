import { z } from "zod";

export const aiTaskSchema = z.object({
  title: z.string().min(1).max(300),
  due: z.string().datetime().optional(),
});

export const aiEventSchema = z.object({
  summary: z.string().min(1).max(300),
  start: z.string().datetime(),
  end: z.string().datetime(),
  /** Minutos antes del evento en los que Google debe avisar (ej. [15, 5]). */
  reminderMinutes: z.array(z.number().int().min(1).max(40320)).max(5).optional(),
});

export const aiSubtaskSchema = z.object({
  title: z.string().min(1).max(200),
  minutes: z.number().int().min(1).max(180),
});

export const aiBreakdownSchema = z.object({
  title: z.string().min(1).max(300),
  totalMinutes: z.number().int().min(1).max(1440),
  subtasks: z.array(aiSubtaskSchema).min(1).max(20),
});

export const aiResponseSchema = z.object({
  reply: z.string().min(1).max(2000),
  action: z.enum(["chat", "create_task", "create_event", "task_breakdown"]),
  task: aiTaskSchema.optional(),
  event: aiEventSchema.optional(),
  breakdown: aiBreakdownSchema.optional(),
});

export type AITask = z.infer<typeof aiTaskSchema>;
export type AIEvent = z.infer<typeof aiEventSchema>;
export type AISubtask = z.infer<typeof aiSubtaskSchema>;
export type AIBreakdown = z.infer<typeof aiBreakdownSchema>;
export type AIResponse = z.infer<typeof aiResponseSchema>;

export interface AIChatApiResponse extends AIResponse {
  providerLabel: string;
}

export interface ChatHistoryMessage {
  role: "user" | "assistant";
  content: string;
}
