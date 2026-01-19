import { createSceneSchema } from "@/lib/scenes/validation";

describe("Scene Validation", () => {
  describe("createSceneSchema", () => {
    it("should validate valid scene creation input", () => {
      const validInput = {
        scriptId: "script-123",
      };

      const result = createSceneSchema.safeParse(validInput);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validInput);
      }
    });

    it("should reject empty scriptId", () => {
      const invalidInput = {
        scriptId: "",
      };

      const result = createSceneSchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message.toLowerCase()).toContain(
          "required"
        );
      }
    });

    it("should reject missing scriptId", () => {
      const invalidInput = {};

      const result = createSceneSchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message.toLowerCase()).toContain(
          "required"
        );
      }
    });
  });
});
