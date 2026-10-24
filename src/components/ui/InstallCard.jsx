import { useState } from "react";
import { isInstalled, isIos, isIosSafari, promptInstall, useInstallPrompt } from "@/lib/install.js";

// Steps for browsers that cannot show an install prompt from a button.
function ManualSteps() {
  if (isIos() && !isIosSafari()) {
    return (
      <p className="small muted">
        Open this page in <b>Safari</b> to install it. Other iPhone browsers can't add apps to the
        Home Screen.
      </p>
    );
  }
  if (isIos()) {
    return (
      <ol className="small muted install-steps">
        <li>
          Tap the <b>Share</b> button at the bottom of Safari.
        </li>
        <li>
          Scroll down and tap <b>Add to Home Screen</b>.
        </li>
        <li>
          Tap <b>Add</b>. NT70 Quest now opens like any other app.
        </li>
      </ol>
    );
  }
  return (
    <ol className="small muted install-steps">
      <li>
        Open your browser's menu (<b>⋮</b> or <b>⋯</b>).
      </li>
      <li>
        Tap <b>Install app</b> or <b>Add to Home screen</b>.
      </li>
      <li>Confirm. NT70 Quest now opens like any other app.</li>
    </ol>
  );
}

// "Get the app" card: hidden once the app is already installed and running as an app.
export function InstallCard() {
  const prompt = useInstallPrompt();
  const [showSteps, setShowSteps] = useState(false);
  if (isInstalled()) {
    return null;
  }

  const install = () => {
    if (prompt) {
      promptInstall();
    } else {
      setShowSteps(true);
    }
  };

  return (
    <section className="card stack install">
      <h3>Get the app</h3>
      <p className="small muted">
        Add NT70 Quest to your home screen. It opens full-screen and works offline, so you can read
        anywhere.
      </p>
      <div>
        <button className="btn sm go" onClick={install}>
          Install app
        </button>
      </div>
      {showSteps ? <ManualSteps /> : null}
    </section>
  );
}
