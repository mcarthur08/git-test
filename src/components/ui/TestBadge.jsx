import { IS_TEST } from "@/firebase-config.js";

// A corner label on the test environment so nobody mistakes it for the real app.
export function TestBadge() {
  if (!IS_TEST) {
    return null;
  }
  return <div className="test-badge">Test environment · not real data</div>;
}
