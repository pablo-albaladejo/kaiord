import { describe, expect, it } from "vitest";

import { scrubAnalyticsString } from "./scrub-analytics-string";

describe("scrubAnalyticsString", () => {
  describe("UUID (rule 1)", () => {
    it("should replace a UUID v4 with <uuid>", () => {
      // Arrange

      // Act

      // Assert
      expect(
        scrubAnalyticsString("not found: 6e3ad6f0-1234-4cdf-9abc-1234567890ab")
      ).toBe("not found: <uuid>");
    });

    it("should do NOT replace a non-UUID hex sequence", () => {
      // Arrange

      // Act

      // Assert
      expect(scrubAnalyticsString("short id: deadbeef")).toBe(
        "short id: deadbeef"
      );
    });
  });

  describe("Bearer (rule 2)", () => {
    it("should replace Bearer <token>", () => {
      // Arrange

      // Act

      // Assert
      expect(scrubAnalyticsString("auth: Bearer abc.def.ghi")).toBe(
        "auth: Bearer <token>"
      );
    });

    it("should preserve trailing punctuation (token-safe class stops at `)`)", () => {
      // Arrange

      // Act

      // Assert
      expect(
        scrubAnalyticsString("Failed: Bearer abc.def.ghi); status=401")
      ).toBe("Failed: Bearer <token>); status=401");
    });

    it("should do NOT replace a non-Bearer prefix", () => {
      // Arrange

      // Act

      // Assert
      expect(scrubAnalyticsString("authorization: token")).toBe(
        "authorization: token"
      );
    });
  });

  describe("Email (rule 3)", () => {
    it("should replace ASCII email", () => {
      // Arrange

      // Act

      // Assert
      expect(scrubAnalyticsString("from user@example.com")).toBe(
        "from <email>"
      );
    });

    it("should replace Spanish-style internationalized email", () => {
      // Arrange

      // Act

      // Assert
      expect(scrubAnalyticsString("from usuario@correo.es")).toBe(
        "from <email>"
      );
    });

    it("should replace CJK local part email", () => {
      // Arrange

      // Act

      // Assert
      expect(scrubAnalyticsString("from 用户@example.cn")).toBe("from <email>");
    });

    it("should replace email with CJK TLD", () => {
      // Arrange

      // Act

      // Assert
      expect(scrubAnalyticsString("from 用户@example.中国")).toBe(
        "from <email>"
      );
    });

    it("should do NOT replace bare @ without a TLD", () => {
      // Arrange

      // Act

      // Assert
      expect(scrubAnalyticsString("look @here")).toBe("look @here");
    });
  });

  describe("Hex run ≥32 (rule 4)", () => {
    it("should replace a 32-char hex run with <hex>", () => {
      // Arrange

      // Act

      // Assert
      expect(scrubAnalyticsString("a".repeat(32))).toBe("<hex>");
    });

    it("should do NOT replace a 31-char hex run", () => {
      // Arrange

      // Act
      const s = "a".repeat(31);

      // Assert
      expect(scrubAnalyticsString(s)).toBe(s);
    });

    it("should make rule 4 win over rule 5 for a 60-char hex run", () => {
      // Arrange

      // Act

      // Assert
      expect(scrubAnalyticsString("a".repeat(60))).toBe("<hex>");
    });
  });

  describe("Base64url run ≥40 (rule 5)", () => {
    it("should replace a 40-char base64url run with <token>", () => {
      // Arrange

      // Act
      const s = "X".repeat(40);

      // Assert
      expect(scrubAnalyticsString(s)).toBe("<token>");
    });

    it("should do NOT replace a 39-char base64url run", () => {
      // Arrange

      // Act
      const s = "X".repeat(39);

      // Assert
      expect(scrubAnalyticsString(s)).toBe(s);
    });

    it("should scrub the long signature portion of a JWT", () => {
      // Arrange
      const jwt =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

      // Act
      const scrubbed = scrubAnalyticsString(`401 token ${jwt} expired`);

      // Assert
      expect(scrubbed).toContain("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9");
      expect(scrubbed).toContain("eyJzdWIiOiIxMjM0NTY3ODkwIn0");
      expect(scrubbed).not.toContain("SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV");
      expect(scrubbed).toContain("<token>");
    });

    it("should do NOT match across spaces (workout titles are safe)", () => {
      // Arrange

      // Act
      const s = "My Big Long Indoor Cycling Workout";

      // Assert
      expect(scrubAnalyticsString(s)).toBe(s);
    });

    it("should over-scrub a 42-char contiguous alphanumeric run (false-positive bias is intentional per design.md D5)", () => {
      // Arrange

      // Act
      const s = "Z".repeat(42);

      // Assert
      expect(scrubAnalyticsString(s)).toBe("<token>");
    });
  });

  describe("Order of operations", () => {
    it("should make Bearer win over base64url (Bearer + JWT replaced as one unit)", () => {
      // Arrange
      const jwt =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

      // Act
      const scrubbed = scrubAnalyticsString(`auth: Bearer ${jwt}`);

      // Assert
      expect(scrubbed).toBe("auth: Bearer <token>");
    });

    it("should independently scrub Bearer + email + hex", () => {
      // Arrange
      const input =
        "auth failed for user@example.com (Bearer abc.def.ghi); key=abcdef0123456789abcdef0123456789abcdef01";

      // Act
      const out = scrubAnalyticsString(input);

      // Assert
      expect(out).toContain("<email>");
      expect(out).toContain("Bearer <token>");
      expect(out).toContain("<hex>");
      expect(out).not.toContain("user@example.com");
      expect(out).not.toContain("abc.def.ghi");
    });
  });

  describe("Multi-line inputs", () => {
    it("should scrub a UUID inside a 6-frame component stack without disturbing newlines", () => {
      // Arrange
      const stack = [
        "    in CoachingActivityDialog",
        "    in DialogContent (id=6e3ad6f0-1234-4cdf-9abc-1234567890ab)",
        "    in CalendarPage",
        "    in Suspense",
        "    in ErrorBoundary",
        "    in App",
      ].join("\n");

      // Act
      const out = scrubAnalyticsString(stack);

      // Assert
      expect(out).toContain("<uuid>");
      expect(out.split("\n")).toHaveLength(6);
    });
  });

  describe("Truncation", () => {
    it("should truncate AFTER scrubbing — placeholders straddling the cut are excluded entirely (never split mid-token)", () => {
      // Arrange
      const before = ".".repeat(498);
      const uuid = "6e3ad6f0-1234-4cdf-9abc-1234567890ab";
      const after = ".".repeat(600 - 498 - uuid.length);
      const input = `${before}${uuid}${after}`;
      expect(input).toHaveLength(600);

      // Act
      const out = scrubAnalyticsString(input, 500);

      // Assert
      expect(out.length).toBeLessThanOrEqual(500);
      expect(out).not.toMatch(/<[a-z]+$/);
      expect(out).not.toMatch(/<[a-z]+>[^>]*<[a-z]+$/);
    });

    it("should include a placeholder that fits fully within maxLen", () => {
      // Arrange
      const before = ".".repeat(100);
      const uuid = "6e3ad6f0-1234-4cdf-9abc-1234567890ab";
      const after = ".".repeat(50);
      const input = `${before}${uuid}${after}`;

      // Act
      const out = scrubAnalyticsString(input, 500);

      // Assert
      expect(out).toContain("<uuid>");
    });

    it("should truncate a 600-char message with no scrub matches to exactly 500 chars", () => {
      // Arrange
      const input = ".".repeat(600);

      // Act
      const out = scrubAnalyticsString(input, 500);

      // Assert
      expect(out.length).toBe(500);
    });

    it("should truncate a 1100-char componentStack to exactly 1000 chars", () => {
      // Arrange
      const input = ".".repeat(1100);

      // Act
      const out = scrubAnalyticsString(input, 1000);

      // Assert
      expect(out.length).toBe(1000);
    });

    it("should do NOT truncate when input is already under maxLen", () => {
      // Arrange
      const input = "short";

      // Act
      const out = scrubAnalyticsString(input, 500);

      // Assert
      expect(out).toBe("short");
    });
  });

  describe("Idempotence", () => {
    it("should be idempotent: scrub(scrub(x)) === scrub(x)", () => {
      // Arrange

      // Act
      const inputs = [
        "not found: 6e3ad6f0-1234-4cdf-9abc-1234567890ab",
        "auth: Bearer abc.def.ghi",
        "from user@example.com",
        "key=" + "a".repeat(32),
        "raw=" + "X".repeat(40),
      ];

      // Assert
      for (const input of inputs) {
        const once = scrubAnalyticsString(input);
        const twice = scrubAnalyticsString(once);
        expect(twice).toBe(once);
      }
    });
  });
});
