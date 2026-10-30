import { describe, it, expect, vi, afterEach } from "vitest";
import { listenForInstall, isInstalled, isIos, isIosSafari, promptInstall } from "./install.js";

const defined = [];
const stub = (name, value) => {
  Object.defineProperty(navigator, name, { value, configurable: true });
  defined.push(name);
};
const setUA = (ua, extra = {}) => {
  stub("userAgent", ua);
  stub("platform", extra.platform || "Win32");
  stub("maxTouchPoints", extra.touch || 0);
};

const IPHONE_SAFARI =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const IPHONE_CHROME =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0 Mobile/15E148 Safari/604.1";
const MAC_SAFARI =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";

afterEach(() => {
  defined.splice(0).forEach(name => delete navigator[name]);
  vi.restoreAllMocks();
});

describe("iOS detection", () => {
  it("recognises iPhone Safari", () => {
    setUA(IPHONE_SAFARI);
    expect(isIos()).toBe(true);
    expect(isIosSafari()).toBe(true);
  });

  it("knows Chrome on iPhone is not Safari", () => {
    setUA(IPHONE_CHROME);
    expect(isIos()).toBe(true);
    expect(isIosSafari()).toBe(false);
  });

  it.each(["FxiOS/120", "EdgiOS/120", "OPiOS/16"])("knows %s is not Safari", token => {
    setUA(IPHONE_SAFARI.replace("Version/17.0", token));
    expect(isIosSafari()).toBe(false);
  });

  it("recognises an iPad that reports itself as a Mac", () => {
    setUA(MAC_SAFARI, { platform: "MacIntel", touch: 5 });
    expect(isIos()).toBe(true);
  });

  it("does not mistake a real Mac for an iPad", () => {
    setUA(MAC_SAFARI, { platform: "MacIntel", touch: 0 });
    expect(isIos()).toBe(false);
    expect(isIosSafari()).toBe(false);
  });

  it("is false on Windows", () => {
    setUA("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0 Safari/537.36");
    expect(isIos()).toBe(false);
  });
});

describe("isInstalled", () => {
  const media = matches => {
    window.matchMedia = vi.fn().mockReturnValue({ matches });
  };

  it("is true in standalone display mode", () => {
    media(true);
    expect(isInstalled()).toBe(true);
  });

  it("is true for iOS's own standalone flag", () => {
    media(false);
    Object.defineProperty(window.navigator, "standalone", { value: true, configurable: true });
    try {
      expect(isInstalled()).toBe(true);
    } finally {
      delete window.navigator.standalone;
    }
  });

  it("is false in a normal browser tab", () => {
    media(false);
    expect(isInstalled()).toBe(false);
  });
});

describe("install prompt", () => {
  const fakePrompt = outcome => {
    const e = new Event("beforeinstallprompt", { cancelable: true });
    e.prompt = vi.fn();
    e.userChoice = Promise.resolve({ outcome });
    return e;
  };

  it("has nothing to offer before the browser sends one", async () => {
    expect(await promptInstall()).toBe(false);
  });

  it("holds on to the browser's prompt and stops the default mini-bar", () => {
    listenForInstall();
    const e = fakePrompt("accepted");
    window.dispatchEvent(e);
    expect(e.defaultPrevented).toBe(true);
  });

  it("shows the prompt once and reports whether it was accepted", async () => {
    listenForInstall();
    const e = fakePrompt("accepted");
    window.dispatchEvent(e);
    expect(await promptInstall()).toBe(true);
    expect(e.prompt).toHaveBeenCalledTimes(1);
    // a prompt can only be used once
    expect(await promptInstall()).toBe(false);
    expect(e.prompt).toHaveBeenCalledTimes(1);
  });

  it("reports false when the user dismisses it", async () => {
    const e = fakePrompt("dismissed");
    window.dispatchEvent(e);
    expect(await promptInstall()).toBe(false);
  });

  it("forgets the prompt once the app is installed", async () => {
    const e = fakePrompt("accepted");
    window.dispatchEvent(e);
    window.dispatchEvent(new Event("appinstalled"));
    expect(await promptInstall()).toBe(false);
    expect(e.prompt).not.toHaveBeenCalled();
  });
});
