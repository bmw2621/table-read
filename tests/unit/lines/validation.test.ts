import { createLineSchema } from "@/lib/lines/validation";

describe("Line Validation", () => {
  describe("createLineSchema", () => {
    it("should validate valid line creation input with character", () => {
      const validInput = {
        text: "Hello, world!",
        characterId: "character-123",
        sceneId: "scene-456",
      };

      const result = createLineSchema.safeParse(validInput);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validInput);
      }
    });

    it("should validate valid line creation input without character", () => {
      const validInput = {
        text: "Hello, world!",
        sceneId: "scene-456",
      };

      const result = createLineSchema.safeParse(validInput);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.characterId).toBeUndefined();
        expect(result.data.text).toBe("Hello, world!");
        expect(result.data.sceneId).toBe("scene-456");
      }
    });

    it("should reject empty text", () => {
      const invalidInput = {
        text: "",
        sceneId: "scene-456",
      };

      const result = createLineSchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message.toLowerCase()).toContain(
          "required"
        );
      }
    });

    it("should reject missing text", () => {
      const invalidInput = {
        sceneId: "scene-456",
      };

      const result = createLineSchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message.toLowerCase()).toContain(
          "required"
        );
      }
    });

    it("should reject missing sceneId", () => {
      const invalidInput = {
        text: "Hello, world!",
      };

      const result = createLineSchema.safeParse(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message.toLowerCase()).toContain(
          "required"
        );
      }
    });
  });
});
