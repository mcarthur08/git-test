# NT70 Quest: web app setup

This guide puts NT70 Quest on its own web address, where youth sign in with **Google** or an **email link**.
It takes about 15 minutes and is free for a youth-group-sized app.

> **Pick one version for the group.** The claude.ai link and this web app keep separate progress.
> Once you switch to the web app, send everyone the new address.

What you'll set up:

| Piece | What it does | Cost |
|---|---|---|
| Firebase Authentication | Google and email-link sign-in | Free (Spark plan) |
| Cloud Firestore | Stores characters, progress and group settings | Free tier is plenty for a youth group |
| GitHub Pages | Hosts the web page at `https://mcarthur08.github.io/git-test/` | Free for public repositories |

---

## 1. Create a Firebase project

1. Go to <https://console.firebase.google.com> and sign in with your Google account.
2. Click **Create a project** (or **Add project**). Name it something like `nt70-quest`.
3. Turn **Google Analytics** off (not needed), then click **Create project**.

## 2. Register the web app and paste its settings

1. On the project overview page, click the **Web** icon (`</>`).
2. Nickname: `NT70 Quest`. Leave "Firebase Hosting" unchecked. Click **Register app**.
3. Firebase shows a `firebaseConfig = { ... }` block. Copy the values into **`src/firebase-config.js`** in this repository, replacing the placeholders:

   ```js
   export const FIREBASE_CONFIG = {
     apiKey: "AIza...",
     authDomain: "nt70-quest.firebaseapp.com",
     projectId: "nt70-quest",
     storageBucket: "nt70-quest.appspot.com",
     messagingSenderId: "1234567890",
     appId: "1:1234567890:web:abc123"
   };
   ```

   These values are meant to be public. The security rules in step 5 are what protect the data.

## 3. Turn on sign-in

1. In the left menu, open **Build › Authentication** and click **Get started**.
2. On the **Sign-in method** tab:
   - **Google**: click it, switch **Enable** on, choose your support email, and click **Save**.
   - **Email/Password**: click it, switch on **Email link (passwordless sign-in)**, and click **Save**.
     (The first switch, for passwords, can stay off.)
3. Open the **Settings** tab › **Authorized domains** › **Add domain**, and add:

   ```
   mcarthur08.github.io
   ```

## 4. Create the database

1. Open **Build › Firestore Database** and click **Create database**.
2. Choose a location near you (for example `nam5 (United States)`). You can't change it later.
3. Start in **production mode** and click **Create**.

## 5. Paste the security rules

1. In Firestore, open the **Rules** tab.
2. Replace everything with the contents of **`firestore.rules`** from this repository.
3. Click **Publish**.

These rules mean:

- Each person can only change their own character and progress.
- Everyone who's signed in can see the leaderboard. They see Bible names only, never real names or emails.
- Only leaders can change the start date and teams, or remove a player.

## 6. Put the site online with GitHub Pages

1. Commit the updated `src/firebase-config.js` to the repository. The site is now a Vite + React app, so run `npm ci && npm run build` and publish the `dist/` folder (the Firebase workflow in step 9 does this for you; plain "Deploy from a branch" no longer works).
2. On GitHub, open the repository's **Settings › Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**. Pick the branch with the app (`master` after this work is merged, or `claude/bible-reading-tracker-avatars-oz590y` for now) and the `/ (root)` folder. Click **Save**.
4. After a minute or two the site is live at **`https://mcarthur08.github.io/git-test/`**.

GitHub Pages is free for public repositories. A private repository needs a paid GitHub plan for Pages.

## 7. Make yourself a leader

1. Open the site, sign in, and create your character.
2. Go to the **Me** tab. Under **Account**, copy your **Account ID**.
3. In the Firebase console, open **Firestore Database › Data** and click **Start collection**:
   - Collection ID: `admins`
   - Document ID: *paste your Account ID*
   - Add a field: `role` (string) = `leader`
   - Click **Save**.
4. Reload the site. The **Leader** tab appears.
5. In **Leader**, check the **Day 1 date** (default **Thursday, Oct 22, 2026**, so Day 70 is **Wednesday, Dec 30, 2026**), set your teams, and click **Save settings**.

To add another leader, repeat step 3 with their Account ID.

## 8. Invite the group

- Send everyone `https://mcarthur08.github.io/git-test/`.
- They sign in with **Continue with Google**, or type their email and tap **Send link**, then open the link from their inbox on the same device.
- On a phone: **Share › Add to Home Screen** (iPhone) or **⋮ › Add to Home screen** (Android). It then opens full-screen like an app.

---

## 9. Recommended: move hosting to Firebase

On GitHub Pages, the site (`github.io`) and Firebase's sign-in page (`firebaseapp.com`) are on different domains. iPhones and the built-in browsers in apps like Instagram and Messages block sign-in across domains. Hosting on Firebase puts both on **`https://nt70-quest.web.app`**, so Google sign-in works everywhere. After setup, every merge to `master` deploys automatically.

### 9a. Turn on Hosting

Firebase console › **Hosting & Serverless › Hosting** › **Get started**. Click **Next** through the install, init and deploy screens (GitHub does those for you), then **Continue to console**.

### 9b. Create a deploy key

1. Open <https://console.cloud.google.com/iam-admin/serviceaccounts?project=nt70-quest>.
2. Click **Create service account**. Name: `github-deploy`. Click **Create and continue**.
3. Add the roles **Firebase Hosting Admin**, **API Keys Viewer** and **Service Usage Consumer**, click **Continue**, then **Done**. (Without Service Usage Consumer, deploys fail with a 403 on `serviceusage.services.get`.)
4. Click the new account › **Keys** › **Add key › Create new key** › **JSON** › **Create**. A `.json` file downloads.

Treat this file like a password. Don't email it or paste it anywhere except the GitHub secret below. Delete it from your computer afterwards.

### 9c. Give the key to GitHub

1. Open <https://github.com/mcarthur08/git-test/settings/secrets/actions/new>.
2. Name: `FIREBASE_SERVICE_ACCOUNT_NT70_QUEST`
3. Secret: open the `.json` file in a text editor and paste its **entire** contents.
4. Click **Add secret**.

### 9d. Deploy

Open <https://github.com/mcarthur08/git-test/actions/workflows/firebase-hosting.yml>, click **Run workflow › Run workflow**, and wait for the green check (about a minute). The site is then live at **https://nt70-quest.web.app**.

### 9e. Allow Google sign-in on the new address

1. Open <https://console.cloud.google.com/apis/credentials?project=nt70-quest> and click **Web client (auto created by Google Service)**.
2. Under **Authorized JavaScript origins**, add `https://nt70-quest.web.app`.
3. Under **Authorized redirect URIs**, add `https://nt70-quest.web.app/__/auth/handler`.
4. Click **Save**. Changes can take a few minutes to apply.

Also check **Authentication › Settings › Authorized domains** in Firebase. `nt70-quest.web.app` is normally listed already; add it if it isn't.

From then on, share **https://nt70-quest.web.app** with the group. GitHub Pages keeps working, but the Firebase address is the one to use. Accounts and progress are the same on both.

## Test environment (separate users and database)

The test site is a second Firebase project (`nt-quest`). It has its own sign-in users, its own Firestore database and its own address (`https://nt-quest.web.app`), so testing never touches the real group's data. Only `npm run build` talks to the live project (`nt70-quest`); `npm run dev` and `npm run build:staging` use the test one. The test site shows a red "Test environment" label.

One-time setup in the test project (<https://console.firebase.google.com>, project `nt-quest`):

1. **Authentication › Sign-in method:** turn on Google, Email link and Email/Password, the same as step 3.
2. **Firestore Database:** click **Create database** (production mode), then paste `firestore.rules` into **Rules** and **Publish** (step 5).
3. **Hosting:** click **Get started** once so the `nt-quest.web.app` site exists.
4. **Make yourself a leader** in the test database (step 7), using your test account's ID.
5. **GitHub secret:** the same as step 9, but for the `nt-quest` project. Create a service account with **Firebase Hosting Admin**, **API Keys Viewer** and **Service Usage Consumer**, download its JSON key, and save it as the repository secret `FIREBASE_SERVICE_ACCOUNT_NT_QUEST`.
6. **Authorized domains:** under Authentication › Settings, add the domains you test from (for example `localhost` is there by default, and each preview address).

Using it:

- **Locally:** `npm run dev` runs against the test project.
- **Every pull request:** the "Firebase preview" workflow posts a temporary preview address (using test data) on the PR.
- **A stable test site:** push to a branch named `staging` (`git push origin <branch>:staging`) and the "Deploy test site" workflow publishes it to `https://nt-quest.web.app`.
- **Rules changes:** `firebase deploy --only firestore:rules --project staging` to try them in the test project first, then publish to live from the console.

## Forgotten passwords (username accounts)

Username accounts have no real email, so a forgotten password can't be reset. Move the person's progress to a new account instead:

1. They open the site, tap **Username › New here**, and create a **new** username and password.
2. In the app, open **Group**, find their **old** character on the leaderboard, and tap **Recover**.
3. Type the **new** username and tap **Move**.
4. The next time they sign in with the new username, their character, reading progress and tribe move over and the old entry disappears.

This needs the latest `firestore.rules` published (step 5).

## Announcing updates ("What's new")

Each series of updates gets a version number and a "What's new" popup. Everyone sees it once, the first time they open the app after it goes live. Anyone who skipped a release sees every version they missed in one popup, newest first. They can see it again any time from **Me › What's new**, where the current version is shown.

To announce a new release, add an entry at the **top** of `RELEASES` in `src/lib/data.js`:

```js
{ v: "1.2", from: "2026-10-31T06:00", title: "A short headline", items: [
  ["group", "Feature name", "One sentence about what changed."],
  ["check", "Bug fixes", "What was fixed."]] },
```

- **Version:** bump the middle number for new features (1.2, 1.3…) and the last number for bug-fix-only releases (1.2.1).
- **`from`:** the local date and time the popup starts showing. Leave it in the past to show it right away.
- **Icons:** today, plan, group, victories, me, journey, book, flame, check, star, crown, target, lock.
- **The "How it works" guide** (the **?** in the header) is the `GUIDE` list in `src/lib/data.js`. Edit it there.
- People who join after a release went out don't get its popup.

## Good to know

- **Ages.** Google accounts need the user to be 13 or older, unless a parent manages the account through Family Link. Email-link sign-in works with any email address. Check your church's policy on collecting youth emails and parental consent.
- **What's stored.** Bible name, character choices, team, and which days were read and when. The sign-in email lives in Firebase Authentication and is never shown to other youth.
- **Email limits.** The free plan limits how many sign-in emails can go out per day. If a big group signs up at once, encourage Google sign-in, or check **Authentication › Usage** in Firebase.
- **Solo mode.** Until `src/firebase-config.js` has real values, the site still works, but progress saves only on each device.

## Files

| File | Purpose |
|---|---|
| `index.html`, `src/` | The React app (Vite). See "Code layout" below. |
| `src/firebase-config.js` | Your Firebase project settings (step 2) |
| `firestore.rules` | Database security rules (step 5) |
| `firebase.json`, `.firebaserc`, `.github/workflows/firebase-hosting.yml` | Firebase Hosting setup and automatic deploys (step 9) |
| `.github/workflows/firebase-preview.yml`, `firebase-staging.yml` | Test environment deploys (see "Test environment") |
| `public/` | Manifest, icons, service worker (`sw.js`), offline page, and the KJV text in `public/kjv/` |

To work on it locally: `npm install`, then `npm run dev`.

## Installing and offline use (PWA)

NT70 Quest is a progressive web app. On a phone, **Share › Add to Home Screen** (iPhone) or **⋮ › Install app** (Android and Chrome) puts it on the home screen and opens it full-screen.

A service worker (`public/sw.js`) saves the app and the whole KJV text on the first visit, so the app opens and every reading works with no connection. Signing in and syncing progress still need a connection.

- It only runs on the deployed (HTTPS) site and in `npm run preview`, not in `npm run dev`.
- After a new deploy, people see a "A new version is ready · Reload" message the next time they open the app.
- If you ever need to force everyone to refetch everything, change `VERSION` at the top of `public/sw.js`.
- Icons and colours come from `public/manifest.webmanifest`.

## Code layout

```
src/
  main.jsx, App.jsx      Entry point, and which screen shows
  store.js               The one shared app state (useStore / setState)
  actions/               Everything the app does: saving, sign-in, rewards, boot (one file per topic)
  lib/                   Pure logic with no React: data.js (plan, releases, guide), player.js, avatar.js, journey.js, quiz.js
  components/ui/         Small reusable pieces: Icon, Avatar, Meter, Reveal, Toast, ReminderCard...
  components/layout/     The header and tab bar
  views/<Screen>/        One folder per screen (Today, Journey, Plan, Group, Victories, Me, Leader, Reader, Quiz, Help, SignIn),
                         with index.jsx composing small cards
```

Imports use `@/` for `src/` (for example `@/lib/data.js`).
