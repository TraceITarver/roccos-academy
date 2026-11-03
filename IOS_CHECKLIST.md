# Rocco's Academy: iOS App Store checklist

The iOS project is in `ios/` (Capacitor 8, bundle id `com.tracetarver.roccosacademy`).
The App Store icon (1024px) is already in the Xcode asset catalog, and other sizes are in `resources/ios-icons/`.

## What Trace needs to do
1. **Join the Apple Developer Program** ($99/year) at developer.apple.com/programs. Enroll as an individual, or as an organization if you have a business (that needs a D-U-N-S number).
2. **Create the app in App Store Connect** (appstoreconnect.apple.com). Choose My Apps → + → New App, use bundle id `com.tracetarver.roccosacademy`, and name it "Rocco's Academy".
3. **Prepare the listing:** description, keywords, support URL (the GitHub Pages site works), a **privacy policy URL** (required; the data stays on the device and nothing is collected), screenshots (6.7" and 6.5" iPhone), age rating, and category (Lifestyle or Education).
4. **Build and sign** with one of the options below.
5. **Test with TestFlight**, then submit for review. Review usually takes 1–3 days.

## Building without a Mac
- **Codemagic** (codemagic.io): has a free tier with macOS build minutes. Connect the GitHub repo, add an App Store Connect API key, and it builds, signs, and uploads to TestFlight. This is the easiest option.
- **Ionic Appflow:** made for Capacitor apps. It's paid.
- **GitHub Actions macOS runners:** free minutes for public repos. They need a workflow plus your signing certificate and provisioning profile, or an App Store Connect API key, stored as secrets (fastlane makes this easier).
- **A rented cloud Mac** (MacinCloud, about $30/mo) to use Xcode directly.

## Developer workflow
```
npm install
npm run sync          # copies web files into www/ and syncs to ios/
npx cap open ios      # (on a Mac) opens Xcode
```
App Store guideline 4.2 ("minimum functionality") can reject apps that are just websites. The native reminders, haptics, and offline use help, but a bit more native polish lowers that risk.

## Monetization setup (Rocco's Academy Plus)
1. **App Store Connect:** sign the Paid Apps agreement and add banking and tax info. Create a subscription group "Rocco's Academy Plus" with two auto-renewing subscriptions: `roccos_plus_monthly` ($6.99/month) and `roccos_plus_yearly` ($39.99/year with a 7-day free-trial introductory offer). Separately, under In-App Purchases, create a **Non-Consumable** `roccos_plus_lifetime` ($119.99) called "Rocco's Academy Plus Lifetime".
2. **RevenueCat** (free until $2.5k/month revenue): create an account and project, add the iOS app (bundle id `com.tracetarver.roccosacademy`), and upload an App Store Connect in-app purchase key. Import all three products, create the entitlement `plus` and attach **all three** (monthly, yearly, lifetime), then create a "default" offering with Monthly, Annual, and Lifetime packages. Restore purchases picks up Lifetime automatically. Paste the public iOS SDK key (`appl_...`) into `config.js` → `REVENUECAT_IOS_API_KEY`, then run `npm run sync`.
3. **Amazon Associates:** sign up at affiliate-program.amazon.com using the live site URL, then put your tracking ID (e.g. `yourname-20`) into `config.js` → `AFFILIATE_TAG`. Amazon requires 3 qualifying sales within 180 days to stay approved.
4. **Web preview of Plus:** open the site with `?dev=plus` (turn it off with `?dev=off`). Web payments aren't wired up.

## Accounts & cloud sync (Firebase)
1. Go to https://console.firebase.google.com → Add project → name it "Roccos Academy" (Analytics optional).
2. Build → Authentication → Get started → Sign-in method: enable **Email/Password** and **Apple**.
   - For Apple: in Apple Developer → Identifiers, enable "Sign in with Apple" on `com.tracetarver.roccosacademy`; create a Services ID + key and paste them into Firebase's Apple provider. Add `traceitarver.github.io` under Authentication → Settings → Authorized domains.
3. Build → Firestore Database → Create database (production mode) → Rules, paste and Publish:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write, delete: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```
4. Project settings → Your apps → Add **Web app** → copy the `firebaseConfig` object and paste its values into `FIREBASE_CONFIG` in `config.js` (or send them to Grok Bot).
5. Then run `npm run sync`, commit, push. Accounts turn on automatically; until then the app stays local-only and shows "coming soon".
Notes: account deletion is in-app (Account → Delete account), as Apple requires. RevenueCat is linked to the Firebase uid on sign-in so purchases follow the account. For native Sign in with Apple inside the iPhone app, a Capacitor Apple sign-in plugin may be needed if the popup flow is blocked in the app's web view; test on device.

## Suggestions (Firestore)
Add this inside `match /databases/{database}/documents { ... }` in your Firestore rules so anyone can submit but nobody can read from the app (read them in the Firebase console):
```
match /suggestions/{id} {
  allow create: if request.resource.data.msg is string && request.resource.data.msg.size() < 5000;
  allow read, update, delete: if false;
}
```
Until Firebase is set up, suggestions open a prefilled email to traceamite@gmail.com.
