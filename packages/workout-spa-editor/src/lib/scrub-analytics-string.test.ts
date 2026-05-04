import { describe, expect, it } from "vitest";

import { scrubAnalyticsString } from "./scrub-analytics-string";

describe("scrubAnalyticsString", () => {
  describe("UUID (rule 1)", () => {
    it("should replace a UUID v4 with <uuid>", () => {
      expect(
        scrubAnalyticsString("not found: 6e3ad6f0-1234-4cdf-9abc-1234567890ab")
      ).toBe("not found: <uuid>");
    });

    it("should do NOT replace a non-UUID hex sequence", () => {
      expect(scrubAnalyticsString("short id: deadbeef")).toBe(
        "short id: deadbeef"
      );
    });
  });

  describe("Bearer (rule 2)", () => {
    it("should replace Bearer <token>", () => {
      expect(scrubAnalyticsString("auth: Bearer abc.def.ghi")).toBe(
        "auth: Bearer <token>"
      );
    });

    it("preserves trailing punctuation (token-safe class stops at `)`)", () => {
      expect(
        scrubAnalyticsString("Failed: Bearer abc.def.ghi); status=401")
      ).toBe("Failed: Bearer <token>); status=401");
    });

    it("should do NOT replace a non-Bearer prefix", () => {
      expect(scrubAnalyticsString("authorization: token")).toBe(
        "authorization: token"
      );
    });
  });

  describe("Email (rule 3)", () => {
    it("should replace ASCII email", () => {
      expect(scrubAnalyticsString("from user@example.com")).toBe(
        "from <email>"
      );
    });

    it("should replace Spanish-style internationalized email", () => {
      expect(scrubAnalyticsString("from usuario@correo.es")).toBe(
        "from <email>"
      );
    });

    it("should replace CJK local part email", () => {
      expect(scrubAnalyticsString("from 用户@example.cn")).toBe("from <email>");
    });

    it("should replace email with CJK TLD", () => {
      expect(scrubAnalyticsString("from 用户@example.中国")).toBe(
        "from <email>"
      );
    });

    it("should do NOT replace bare @ without a TLD", () => {
      expect(scrubAnalyticsString("look @here")).toBe("look @here");
    });
  });

  describe("Hex run ≥32 (rule 4)", () => {
    it("should replace a 32-char hex run with <hex>", () => {
      expect(scrubAnalyticsString("a".repeat(32))).toBe("<hex>");
    });

    it("should do NOT replace a 31-char hex run", () => {
      const s = "a".repeat(31);
      expect(scrubAnalyticsString(s)).toBe(s);
    });

    it("should make rule 4 win over rule 5 for a 60-char hex run", () => {
      expect(scrubAnalyticsString("a".repeat(60))).toBe("<hex>");
    });
  });

  describe("Base64url run ≥40 (rule 5)", () => {
    it("should replace a 40-char base64url run with <token>", () => {
      const s = "X".repeat(40);
      expect(scrubAnalyticsString(s)).toBe("<token>");
    });

    it("should do NOT replace a 39-char base64url run", () => {
      const s = "X".repeat(39);
      expect(scrubAnalyticsString(s)).toBe(s);
    });

    it("should scrub the long signature portion of a JWT", () => {
      const jwt =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
      const scrubbed = scrubAnalyticsString(`401 token ${jwt} expired`);
      // header (36 chars) and payload (27 chars) survive — both below
      // the 40-char threshold by design (see analytics-port spec §5).
      // Only the 43-char signature becomes <token>.
      expect(scrubbed).toContain("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9");
      expect(scrubbed).toContain("eyJzdWIiOiIxMjM0NTY3ODkwIn0");
      expect(scrubbed).not.toContain("SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV");
      expect(scrubbed).toContain("<token>");
    });

    it("should do NOT match across spaces (workout titles are safe)", () => {
      const s = "My Big Long Indoor Cycling Workout";
      expect(scrubAnalyticsString(s)).toBe(s);
    });

    it("should over-scrub a 42-char contiguous alphanumeric run (false-positive bias is intentional per design.md D5)", () => {
      // Non-hex chars (Z is outside [0-9a-f]) so rule 4 (hex) doesn't
      // intercept; rule 5 base64url matches the full 42-char run.
      const s = "Z".repeat(42);
      expect(scrubAnalyticsString(s)).toBe("<token>");
    });
  });

  describe("Order of operations", () => {
    it("should make Bearer win over base64url (Bearer + JWT replaced as one unit)", () => {
      const jwt =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
      const scrubbed = scrubAnalyticsString(`auth: Bearer ${jwt}`);
      expect(scrubbed).toBe("auth: Bearer <token>");
    });

    it("should independently scrub Bearer + email + hex", () => {
      const input =
        "auth failed for user@example.com (Bearer abc.def.ghi); key=abcdef0123456789abcdef0123456789abcdef01";
      const out = scrubAnalyticsString(input);
      expect(out).toContain("<email>");
      expect(out).toContain("Bearer <token>");
      expect(out).toContain("<hex>");
      expect(out).not.toContain("user@example.com");
      expect(out).not.toContain("abc.def.ghi");
    });
  });

  describe("Multi-line inputs", () => {
    it("should scrub a UUID inside a 6-frame component stack without disturbing newlines", () => {
      const stack = [
        "    in CoachingActivityDialog",
        "    in DialogContent (id=6e3ad6f0-1234-4cdf-9abc-1234567890ab)",
        "    in CalendarPage",
        "    in Suspense",
        "    in ErrorBoundary",
        "    in App",
      ].join("\n");
      const out = scrubAnalyticsString(stack);
      expect(out).toContain("<uuid>");
      expect(out.split("\n")).toHaveLength(6);
    });
  });

  describe("Truncation", () => {
    it("should truncate AFTER scrubbing — placeholders straddling the cut are excluded entirely (never split mid-token)", () => {
      // UUID positioned so the resulting <uuid> placeholder spans
      // offsets 498-503 (length 6). Truncating to 500 would naively
      // produce "....<u". Instead, the truncator backs up to before
      // the placeholder so the output ends at offset 498 (no half
      // placeholder).
      const before = ".".repeat(498);
      const uuid = "6e3ad6f0-1234-4cdf-9abc-1234567890ab";
      const after = ".".repeat(600 - 498 - uuid.length);
      const input = `${before}${uuid}${after}`;
      expect(input).toHaveLength(600);

      const out = scrubAnalyticsString(input, 500);

      expect(out.length).toBeLessThanOrEqual(500);
      // Critical: never end with a partial placeholder.
      expect(out).not.toMatch(/<[a-z]+$/);
      expect(out).not.toMatch(/<[a-z]+>[^>]*<[a-z]+$/);
    });

    it("should include a placeholder that fits fully within maxLen", () => {
      // UUID positioned so its scrubbed form ends well before maxLen.
      const before = ".".repeat(100);
      const uuid = "6e3ad6f0-1234-4cdf-9abc-1234567890ab";
      const after = ".".repeat(50);
      const input = `${before}${uuid}${after}`;

      const out = scrubAnalyticsString(input, 500);

      expect(out).toContain("<uuid>");
    });

    it("should truncate a 600-char message with no scrub matches to exactly 500 chars", () => {
      const input = ".".repeat(600);

      const out = scrubAnalyticsString(input, 500);

      expect(out.length).toBe(500);
    });

    it("should truncate a 1100-char componentStack to exactly 1000 chars", () => {
      const input = ".".repeat(1100);

      const out = scrubAnalyticsString(input, 1000);

      expect(out.length).toBe(1000);
    });

    it("should do NOT truncate when input is already under maxLen", () => {
      const input = "short";

      const out = scrubAnalyticsString(input, 500);

      expect(out).toBe("short");
    });
  });

  describe("Idempotence", () => {
    it("should be idempotent: scrub(scrub(x)) === scrub(x)", () => {
      const inputs = [
        "not found: 6e3ad6f0-1234-4cdf-9abc-1234567890ab",
        "auth: Bearer abc.def.ghi",
        "from user@example.com",
        "key=" + "a".repeat(32),
        "raw=" + "X".repeat(40),
      ];

      for (const input of inputs) {
        const once = scrubAnalyticsString(input);
        const twice = scrubAnalyticsString(once);
        expect(twice).toBe(once);
      }
    });
  });
});
