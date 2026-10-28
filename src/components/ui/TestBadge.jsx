import { IS_TEST } from "@/firebase-config.js";

// A label on every test build, so nobody mistakes the test copy for the real group.
export function TestBadge() {
  if (!IS_TEST) {
    return null;
  }
  return (
    <div className="test-badge" role="note">
      Test environment · not the real group
    </div>
  );
}
