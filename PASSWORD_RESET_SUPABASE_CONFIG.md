# Password Reset - Konfiguracja Supabase

## Problem
Link resetowania hasła z emaila przekierowuje użytkownika na stronę główną (`/`) zamiast na stronę resetowania hasła (`/reset-password`). Następnie aplikacja próbuje wykryć token i przekierować użytkownika, ale czasami Supabase już przekierowało użytkownika do Site URL.

## Rozwiązanie
Musisz zaktualizować ustawienia redirect URL w Supabase Dashboard.

## Kroki konfiguracji w Supabase Dashboard

1. **Zaloguj się do Supabase Dashboard**
   - Idź do: https://supabase.com/dashboard
   - Wybierz swój projekt: `svlxczytgstimushobmu`

2. **Przejdź do ustawień URL Redirect**
   - W lewym menu kliknij **Authentication** (ikona klucza/użytkownika)
   - Kliknij **URL Configuration**

3. **Zaktualizuj Site URL**
   - Pole **Site URL** powinno być ustawione na: `https://www.pilliox.com`
   - To jest już poprawnie ustawione

4. **Dodaj Redirect URLs**
   W sekcji **Redirect URLs** dodaj następujące URL-e (każdy w nowej linii):
   ```
   https://www.pilliox.com/reset-password
   https://www.pilliox.com/**
   http://localhost:5173/reset-password
   http://localhost:5173/**
   ```
   
   **UWAGA:** Każdy URL musi być w osobnej linii. Użyj przycisku "Add URL" lub oddziel je enterem.

5. **Zapisz zmiany**
   - Kliknij **Save** na dole strony

## Testowanie

Po zapisaniu zmian:

1. **Wyślij nowy email resetowania hasła** z formularza "Forgot Password"
2. **Sprawdź email** - link powinien wyglądać tak:
   ```
   https://svlxczytgstimushobmu.supabase.co/auth/v1/verify?token=...&type=recovery&redirect_to=https://www.pilliox.com/reset-password
   ```
3. **Kliknij w link** - Supabase powinno przekierować Cię bezpośrednio na `/reset-password` z tokenem w URL
4. **Wprowadź nowe hasło** i potwierdź

## Co zmieniliśmy w kodzie

### W `/src/app/App.tsx`:
- Dodaliśmy `window.location.replace()` zamiast zwykłej nawigacji, aby uniknąć dodawania do historii przeglądarki
- Dodaliśmy lepsze logowanie aby zobaczyć co się dzieje

### Dlaczego to działa:
1. **Email zawiera redirect_to**: `redirect_to=https://www.pilliox.com/reset-password`
2. **Supabase weryfikuje token** i przekierowuje na ten URL z hash parametrami
3. **Aplikacja wykrywa** `#access_token=...&type=recovery` w URL
4. **ResetPasswordPage** używa tego tokena do aktualizacji hasła przez Supabase SDK

## Alternatywne rozwiązanie (jeśli powyższe nie działa)

Jeśli nadal masz problemy, możesz zmienić **redirect_to** w `/supabase/functions/server/index.tsx`:

```typescript
const redirectUrl = 'https://www.pilliox.com/reset-password';
```

Ale to już jest poprawnie ustawione w kodzie.

## Email Templates

Opcjonalnie, możesz też sprawdzić szablon emaila w Supabase Dashboard:
1. **Authentication** → **Email Templates**
2. Wybierz **Reset Password**
3. Sprawdź czy zawiera zmienną `{{ .ConfirmationURL }}` - to jest prawidłowy link

## Logi do debugowania

Po wdrożeniu, otwórz Console (F12) w przeglądarce i sprawdź logi:
```
🔍 [App] Checking for recovery params: ...
🔐 Password reset detected in URL, redirecting to reset-password page
🔀 Redirecting from / to /reset-password
🔍 [ResetPassword] Full URL received: ...
[ResetPassword] ✅ Found hash access token
```

## Dodatkowe informacje

- **Service Role Key** jest używany tylko na backendzie do wysyłania emaili
- **Anon Key** jest używany w frontendzie i jest bezpieczny do publicznego użycia
- Token resetowania jest **jednorazowy** - po użyciu wygasa
- Token resetowania **wygasa po 1 godzinie** (domyślne ustawienie Supabase)
