import { describe, it, expect } from "vitest";
import {
  USER_DOMAIN,
  cleanUsername,
  usernameOf,
  authMsg,
  userAuthMsg,
  POPUP_HELP
} from "./account.js";

describe("cleanUsername", () => {
  it("lowercases and turns spaces into dots", () => {
    expect(cleanUsername("  Bob Smith ")).toBe("bob.smith");
  });

  it("drops characters an email name can't have", () => {
    expect(cleanUsername("Bob!@#$%^&*()+=Smith")).toBe("bobsmith");
  });

  it("keeps dots, underscores and hyphens inside the name", () => {
    expect(cleanUsername("a.b_c-d")).toBe("a.b_c-d");
  });

  it("collapses runs of separators to the first one", () => {
    expect(cleanUsername("a..b")).toBe("a.b");
    expect(cleanUsername("a._-b")).toBe("a.b");
    expect(cleanUsername("a   b")).toBe("a.b");
  });

  it("strips separators from both ends", () => {
    expect(cleanUsername("..bob--")).toBe("bob");
    expect(cleanUsername("-_-")).toBe("");
  });

  it("caps the length at 24", () => {
    expect(cleanUsername("a".repeat(40))).toHaveLength(24);
  });

  it("never ends on a separator, even when the cap lands on one", () => {
    const name = cleanUsername("a".repeat(23) + ".b");
    expect(name).not.toMatch(/[._-]$/);
  });

  it("copes with empty and non-string input", () => {
    expect(cleanUsername("")).toBe("");
    expect(cleanUsername(null)).toBe("");
    expect(cleanUsername(undefined)).toBe("");
  });

  it("is idempotent", () => {
    ["Bob Smith", "a..b", "-x-", "MiXeD_Case.99"].forEach(v => {
      expect(cleanUsername(cleanUsername(v))).toBe(cleanUsername(v));
    });
  });
});

describe("usernameOf", () => {
  it("pulls the name off a username account's email", () => {
    expect(usernameOf(`bob.smith@${USER_DOMAIN}`)).toBe("bob.smith");
  });

  it("returns an empty string for real email addresses", () => {
    expect(usernameOf("bob@gmail.com")).toBe("");
    expect(usernameOf(`bob@evil.${USER_DOMAIN}`)).toBe("");
  });

  it("returns an empty string when there is no email", () => {
    expect(usernameOf(null)).toBe("");
    expect(usernameOf(undefined)).toBe("");
    expect(usernameOf("")).toBe("");
  });
});

describe("authMsg", () => {
  it.each([
    ["auth/invalid-email", /doesn't look right/],
    ["auth/invalid-action-code", /expired or was already used/],
    ["auth/expired-action-code", /expired or was already used/],
    ["auth/unauthorized-domain", /isn't approved/],
    ["auth/operation-not-allowed", /isn't turned on/],
    ["auth/network-request-failed", /No connection/]
  ])("explains %s", (code, re) => {
    expect(authMsg({ code })).toMatch(re);
  });

  it.each([
    "auth/popup-blocked",
    "auth/operation-not-supported-in-this-environment",
    "auth/web-storage-unsupported"
  ])("shows the browser help for %s", code => {
    expect(authMsg({ code })).toBe(POPUP_HELP);
  });

  it("falls back to a generic message", () => {
    expect(authMsg({ code: "auth/whatever" })).toMatch(/didn't work/);
    expect(authMsg({})).toMatch(/didn't work/);
    expect(authMsg(null)).toMatch(/didn't work/);
  });
});

describe("userAuthMsg", () => {
  it("says the username is taken", () => {
    expect(userAuthMsg({ code: "auth/email-already-in-use" }, true)).toMatch(/taken/);
  });

  it.each([
    "auth/invalid-credential",
    "auth/invalid-login-credentials",
    "auth/wrong-password",
    "auth/user-not-found"
  ])("words %s differently for sign-up and sign-in", code => {
    expect(userAuthMsg({ code }, true)).toMatch(/create that account/);
    expect(userAuthMsg({ code }, false)).toMatch(/don't match/);
  });

  it("explains weak passwords and rate limiting", () => {
    expect(userAuthMsg({ code: "auth/weak-password" })).toMatch(/6 characters/);
    expect(userAuthMsg({ code: "auth/too-many-requests" })).toMatch(/Too many/);
  });

  it("names Email/Password when username sign-in is off", () => {
    expect(userAuthMsg({ code: "auth/operation-not-allowed" })).toMatch(/Email\/Password/);
  });

  it("defers to authMsg for anything else", () => {
    expect(userAuthMsg({ code: "auth/network-request-failed" })).toBe(
      authMsg({ code: "auth/network-request-failed" })
    );
  });
});
