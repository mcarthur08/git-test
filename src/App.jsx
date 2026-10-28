import { useEffect } from "react";
import { setState, useStore } from "@/store.js";
import { draftFrom } from "@/lib/player.js";
import { boot, checkWhatsNew, checkGuide, flushMark } from "@/actions";
import Header from "@/components/layout/Header.jsx";
import { Avatar } from "@/components/ui/Avatar.jsx";
import { BackButton } from "@/components/ui/BackButton.jsx";
import { Toast } from "@/components/ui/Toast.jsx";
import { Reveal } from "@/components/ui/Reveal.jsx";
import { TestBadge } from "@/components/ui/TestBadge.jsx";
import SignIn from "@/views/SignIn/index.jsx";
import Editor from "@/views/Me/Editor.jsx";
import Today from "@/views/Today/index.jsx";
import Journey from "@/views/Journey/index.jsx";
import Plan from "@/views/Plan/index.jsx";
import Group from "@/views/Group/index.jsx";
import Victories from "@/views/Victories/index.jsx";
import Me from "@/views/Me/index.jsx";
import Leader from "@/views/Leader/index.jsx";
import Reader from "@/views/Reader/index.jsx";
import Quiz from "@/views/Quiz/index.jsx";
import Help from "@/views/Help/index.jsx";
import Chat from "@/views/Chat/index.jsx";

// Which screen is showing: the sign-in / join flow first, then one view per tab.
function View() {
  const { phase, tab } = useStore();
  if (phase === "loading") {
    return (
      <div className="loading">
        <Avatar look={{}} n={0} live />
        <p className="disp">Lighting the lamps…</p>
      </div>
    );
  }
  if (phase === "signin") {
    return <SignIn />;
  }
  if (phase === "join") {
    return <Editor onboarding />;
  }
  switch (tab) {
    case "journey":
      return <Journey />;
    case "plan":
      return (
        <>
          <BackButton tab="today" label="Back to Today" />
          <Plan />
        </>
      );
    case "group":
      return <Group />;
    case "victories":
      return <Victories />;
    case "me":
      return <Me />;
    case "leader":
      return (
        <>
          <BackButton tab="me" label="Back to Me" />
          <Leader />
        </>
      );
    case "read":
      return <Reader />;
    case "quiz":
      return <Quiz />;
    case "help":
      return <Help />;
    case "chat":
      return (
        <>
          <BackButton tab="today" label="Back to Today" />
          <Chat />
        </>
      );
    default:
      return <Today />;
  }
}

export default function App() {
  const { phase, tab, draft, me } = useStore();
  useEffect(() => {
    boot();
  }, []);
  // Release notes and the first-run guide wait until the player is in, and catch a release that goes live while the app sits open.
  const meId = me && me.id;
  useEffect(() => {
    checkWhatsNew();
    checkGuide();
  }, [phase, meId]);
  useEffect(() => {
    const onVisible = () => {
      if (document.hidden) {
        flushMark();
      } else {
        checkWhatsNew();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);
  // The Me tab edits a copy of the character.
  useEffect(() => {
    if (phase === "ready" && tab === "me" && !draft && me) {
      setState({ draft: draftFrom(me) });
    }
  }, [phase, tab, draft, me]);
  return (
    <>
      <TestBadge />
      <Header />
      <main id="main" className="wrap enter" aria-live="polite" key={phase + ":" + tab}>
        <View />
      </main>
      <Toast />
      <Reveal />
    </>
  );
}
