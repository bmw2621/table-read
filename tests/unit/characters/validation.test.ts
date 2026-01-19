import { createCharacterSchema } from "@/lib/characters/validation";

describe("Character Validation", () => {
  describe("createCharacterSchema", () => {
    it("should validate valid character creation input", () => {
      const validInput = {
        scriptId: "script-123",
      };

      const result = createCharacterSchema.safeParse(validInput);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validInput);
      }
    });

    it("should reject empty scriptId", () => {
      const invalidInput = {
        scriptId: "",
      };

      const result = createCharacterSchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message.toLowerCase()).toContain(
          "required"
        );
      }
    });

    it("should reject missing scriptId", () => {
      const invalidInput = {};

      const result = createCharacterSchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message.toLowerCase()).toContain(
          "required"
        );
      }
    });
  });
});
