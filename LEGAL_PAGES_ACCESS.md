# Privacy Policy & Terms of Service - Access Guide

## ✅ Already Implemented!

The Privacy Policy and Terms of Service pages are fully implemented and accessible in your Pilliox app.

## 📍 Where to Find Them

### 1. **Auth Screen (Login/Signup)**
At the bottom of the authentication form, you'll see:
> "By signing up, you agree to our [Terms of Service] and [Privacy Policy]"

**Languages supported:**
- 🇬🇧 English: "By signing up, you agree to our"
- 🇩🇪 German: "Mit der Anmeldung stimmen Sie unseren"
- 🇵🇱 Polish: "Rejestrując się, zgadzasz się z naszym"

### 2. **Direct Page URLs**
The pages are integrated into your app routing:
- **Terms of Service**: Accessible by clicking "Terms of Service" link
- **Privacy Policy**: Accessible by clicking "Privacy Policy" link

## 🎨 Features

### Both pages include:
- ✅ **Multi-language support** (English, German, Polish)
- ✅ **Language selector** in the header
- ✅ **Back button** to return to login
- ✅ **Scrollable content** within the card
- ✅ **Theme support** (Light/Dark mode)
- ✅ **Consistent design** matching your app's gray color scheme
- ✅ **Mobile responsive** layout
- ✅ **Accessible without login**

## 🔧 Technical Implementation

### App.tsx Navigation
```typescript
if (currentPage === "terms") {
  return <TermsOfService onBack={() => setCurrentPage("auth")} />;
}

if (currentPage === "privacy") {
  return <PrivacyPolicy onBack={() => setCurrentPage("auth")} />;
}
```

### AuthForm.tsx Links
```typescript
<button
  type="button"
  onClick={onNavigateToTerms}
  className="text-blue-600 dark:text-blue-400 hover:underline"
>
  {t("docs.termsOfService.title")}
</button>

<button
  type="button"
  onClick={onNavigateToPrivacy}
  className="text-blue-600 dark:text-blue-400 hover:underline"
>
  {t("docs.privacyPolicy.title")}
</button>
```

## 📱 User Flow

1. User opens the app → Sees Login/Signup screen
2. At bottom of form: "By signing up, you agree to our [Terms of Service] and [Privacy Policy]"
3. Clicks either link → Navigates to full legal page
4. Reads content with scrolling
5. Can change language using dropdown in header
6. Clicks "Back" → Returns to auth screen

## ✨ Design Details

- **Background**: Uses `bg-background` (white/dark)
- **Card**: Uses `bg-card` with border
- **Text**: Uses `text-foreground` for maximum readability
- **Scrolling**: Max height = viewport - 8rem (for header + padding)
- **Sticky header**: Header stays visible while content scrolls

---

**Everything is ready to use!** The links are live on your authentication screen.
