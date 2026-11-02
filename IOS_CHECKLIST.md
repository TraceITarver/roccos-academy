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
