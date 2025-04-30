import { z } from "zod";

export function validateArgs<T extends z.ZodSchema>(
  schema: T,
  args: any,
): z.infer<T> {
  try {
    return schema.parse(args);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Validation failed: ${error.errors.map((e) => e.message).join(", ")}`,
      );
    }
    throw error;
  }
}
