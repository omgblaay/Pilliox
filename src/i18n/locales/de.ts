import { add } from "date-fns";
import { Donut } from "lucide-react";

export default {
  app: {
    name: "Pilliox",
    welcome: "Willkommen, {{name}}",
  },
  nav: {
    calendar: "Kalender",
    medications: "Medikamente",
    profile: "Profil",
    settings: "Einstellungen",
    addDays: "Tage hinzufügen",
  },
  basic: {
    ok: "Ok",
    add: "Hinzufügen",
    cancel: "Abbrechen",
    delete: "Löschen",
    save: "Speichern",
    mark: "Markieren",
    clear: "Löschen",
  },
  landing: {
    header: {
      signIn: "Anmelden",
      getStarted: "Jetzt starten",
      goToApp: "Zur App",
    },
    hero: {
      title: "Ihre medizinischen Werte,",
      titleHighlight: "Perfekt erfasst",
      description:
        "Verfolgen Sie INR, Bluttests und Medikamente mit einer schönen Kalenderoberfläche. Für Einfachheit entwickelt, für Zuverlässigkeit gebaut.",
      startTrial: "Kostenlose Testversion starten",
      pricing: "3 Tage kostenlos, dann 2,99 €/Monat",
      trustedBadge: "Your new tracking app",
    },
    features: {
      title: "Alles, was Sie brauchen",
      description:
        "Leistungsstarke Funktionen für müheloses medizinisches Tracking",
      calendar: {
        title: "Intelligente Kalenderansicht",
        description:
          "Verfolgen Sie medizinische Werte wie INR und Bluttestergebnisse mit einer intuitiven Kalenderoberfläche.",
      },
      pillCounter: {
        title: "Tablettenzähler",
        description:
          "Verpassen Sie keine Dosis mit unserem intelligenten Tracking-System für Ihre Medikamente.",
      },
      colorCoded: {
        title: "Farbcodierte Verfolgung",
        description:
          "Mehrtägige Auswahl mit Farbcodierung für Behandlungsperioden und Tags zur einfachen visuellen Organisation.",
      },
      secure: {
        title: "Sicher & Privat",
        description:
          "Ihre medizinischen Daten werden verschlüsselt und sicher mit Unternehmenssicherheit gespeichert.",
      },
      multiLanguage: {
        title: "Mehrsprachig",
        description:
          "Verfügbar in Deutsch, Polnisch und Englisch für Benutzer weltweit.",
      },
    },
    pricing: {
      title: "Einfache, transparente Preise",
      description:
        "Beginnen Sie mit einer kostenlosen Testversion, dann weniger als eine Tasse Kaffee pro Monat",
      plan: "Premium",
      price: "2,99 €",
      perMonth: "/Monat",
      trialIncluded:
        "3-tägige kostenlose Testversion inklusive",
      features: {
        tracking: "Unbegrenzte Verfolgung medizinischer Werte",
        pillCounter: "Intelligenter Tablettenzähler",
        colorCoded: "Mehrtägige farbcodierte Auswahl",
        tags: "Benutzerdefinierte Tags und Labels",
        backup: "Sichere Cloud-Sicherung",
        multiLanguage: "Mehrsprachige Unterstützung",
        support: "Prioritäts-Kundensupport",
      },
      cta: "Starten Sie Ihre kostenlose Testversion",
      cancelAnytime:
        "Jederzeit kündbar. Keine Verpflichtung erforderlich.",
    },
    cta: {
      title: "Bereit, die Kontrolle zu übernehmen?",
      description: "Tausende Nutzer vertrauen Pilliox mit ihrer medizinischen Verfolgung",
      button: "Jetzt starten",
    },
    whyChoose: {
      title: "Warum Pilliox wählen?",
      easyTracking: {
        title: "Einfache Verfolgung",
        description: "Intuitive Kalenderoberfläche, speziell für INR-Werte und Medikamentenverwaltung entwickelt",
      },
      privacyFirst: {
        title: "Datenschutz zuerst",
        description: "Ihre medizinischen Daten sind verschlüsselt und sicher. Wir geben Ihre Informationen niemals an Dritte weiter",
      },
      builtForYou: {
        title: "Für Sie gebaut",
        description: "Entwickelt von Gesundheitsenthusiasten, die die Herausforderungen der Medikamentenverfolgung verstehen",
      },
    },
    footer: {
      copyright: "© 2026 Pilliox. Alle Rechte vorbehalten.",
      privacy: "Datenschutzrichtlinie",
      terms: "Nutzungsbedingungen",
    },
  },
  auth: {
    welcome: "Willkommen bei Pilliox",
    login: "Anmelden",
    signup: "Registrieren",
    signupButton: "Registrieren",
    email: "E-Mail",
    emailPlaceholder: "ihre@email.com",
    password: "Passwort",
    passwordPlaceholder: "Passwort",
    passwordPlaceholderDots: "Passwort",
    name: "Name",
    namePlaceholder: "Ihr Name",
    loggingIn: "Anmeldung...",
    signingUp: "Registrierung...",
    forgotPassword: "Passwort vergessen?",
    forgotPasswordDescription: "Geben Sie Ihre E-Mail-Adresse ein und wir senden Ihnen einen Link zum Zurücksetzen Ihres Passworts.",
    sendResetLink: "Link senden",
    sendResetCode: "Reset-Code senden",
    sending: "Wird gesendet...",
    checkYourEmail: "Überprüfen Sie Ihre E-Mail",
    resetLinkSent: "Link zum Zurücksetzen wurde an Ihre E-Mail gesendet",
    enterCodeAndPassword: "Geben Sie den Code aus Ihrer E-Mail und Ihr neues Passwort ein",
    passwordResetSuccessful: "Passwort erfolgreich zurückgesetzt!",
    redirectingToLogin: "Weiterleitung zur Anmeldung...",
    checkEmailMessage: "Überprüfen Sie Ihre E-Mail! Wir haben einen Link zum Zurücksetzen des Passworts gesendet an",
    checkInboxMessage: "Bitte überprüfen Sie Ihren Posteingang und klicken Sie auf den Link, um fortzufahren.",
    didntReceiveEmail: "E-Mail nicht erhalten?",
    tryAgain: "Erneut versuchen",
    resendCode: "Code erneut senden",
    resendCodeIn: "Code erneut senden ({{seconds}}s)",
    resetCode: "Reset-Code",
    resetPassword: "Passwort zurücksetzen",
    resetPasswordDescription: "Geben Sie Ihre E-Mail ein, um Anweisungen zum Zurücksetzen zu erhalten",
    resetPasswordButton: "Passwort zurücksetzen",
    backToLogin: "Zurück zur Anmeldung",
    backToHome: "Zurück zur Startseite",
    enterNewPassword: "Geben Sie unten Ihr neues Passwort ein",
    newPassword: "Neues Passwort",
    newPasswordPlaceholder: "Neues Passwort eingeben (mind. 6 Zeichen)",
    confirmPassword: "Passwort bestätigen",
    confirmPasswordPlaceholder: "Neues Passwort bestätigen",
    resetting: "Zurücksetzen...",
    passwordResetSuccess: "Passwort erfolgreich zurückgesetzt",
    resetPasswordError: "Passwort konnte nicht zurückgesetzt werden",
    passwordMinLength: "Passwort muss mindestens 6 Zeichen lang sein",
    passwordsDontMatch: "Passwörter stimmen nicht überein",
    invalidResetLink: "Ungültiger oder abgelaufener Link. Bitte fordern Sie einen neuen an.",
    resetLinkExpired: "Dieser Link zum Zurücksetzen des Passworts ist abgelaufen. Bitte fordern Sie einen neuen an.",
    sessionVerificationError: "Sitzung konnte nicht überprüft werden. Bitte versuchen Sie es erneut.",
    sessionExpired: "Ihre Sitzung ist abgelaufen. Bitte fordern Sie einen neuen Link an.",
    passwordResetFailed: "Passwort zurücksetzen fehlgeschlagen",
    orContinueWith: "Oder",
    bySigningUp: "Wenn Sie fortfahren, stimmen Sie unseren",
    and: "und",
    termsOfService: "Nutzungsbedingungen",
    privacyPolicy: "Datenschutzrichtlinie",
    invalidLoginCredentials: "Ungültige Anmeldedaten",
    features: {
      title: "Verfolgen Sie Ihre medizinischen Werte & Medikamente",
      medications:
        "Tägliche Medikamentenverfolgung mit individuellen Dosierungen",
      inrTracking: "Überwachung von Blutwerten und Ergebnissen",
      colorCoded:
        "Farbcodierung von Behandlungsperioden mit Tags",
      notes: "Medizinische Notizen zu jedem Tag hinzufügen",
    },
  },
  calendar: {
    title: "Kalender",
    day: "Tag",
    markDays: "Tage markieren",
    pills: "Medikamente",
    pillsUnit: "Tabletten",
    noPillsConfigured:
      "Noch keine Medikamente konfiguriert. Konfigurieren Sie sie in den Einstellungen.",
    otherMedications: "Andere Medikamente",
    addMed: "Hinzufügen",
    addOtherMedication: "Anderes Medikament hinzufügen",
    addOtherMedicationDesc: "Fügen Sie ein einmaliges Medikament hinzu, das nicht zu Ihrem regulären Zeitplan gehört.",
    editOtherMedication: "Bearbeiten",
    editOtherMedicationDesc: "Aktualisierenen Sie die Details",
    medicationName: "Name",
    medicationNamePlaceholder: "z.B. Aspirin, Ibuprofen",
    pillsAndValues: "Tabletten und Werte",
    dosage: "Dosierung",
    unit: "Einheit",
    tablets: "Tabletten",
    capsules: "Kapseln",
    drops: "Tropfen",    
    save: "Speichern",
    delete: "Löschen",
    cancel: "Abbrechen",
    // Unit translations
    units: {
      mg: "mg",
      g: "g",
      ml: "ml",
      mcg: "mcg",
      tablets: "Tabletten",
      capsules: "Kapseln",
      drops: "Tropfen",
      pieces: "Stück",
      units: "Einheiten",
    },
    add: "Hinzufügen",
    update: "Aktualisieren",
    notification: "Benachrichtigung",
    enableNotification: "Erinnerung aktivieren",
    notificationTime: "Erinnerungszeit",
    notificationDesc: "Sie erhalten zu dieser Zeit eine Erinnerung, Ihr Medikament einzunehmen.",
    note: "Notiz",
    apply: "Anwenden",
    loading: "Laden...",
    colorTag: "Farbe & Tag",
    removeTag: "Entfernen",
    noTag: "Kein Tag",
    weekView: "Wochenansicht",
    monthView: "Monatsansicht",
    weeklyPreview: "Woche",
    monthlyPreview: "Monat",
  },
  day: {
    description:
      "Verfolgen Sie Ihre INR-Werte, Medikamente und Notizen",
    notePlaceholder: "Notiz hinzufügen...",
    delete: "Löschen",
    saveChanges: "Ok",
  },
  multiSelect: {
    title: "{{count}} Tag(e) färben",
    title_plural: "{{count}} Tag(e) färben",
    description:
      "Wählen Sie eine Farbe und optional ein Tag für die ausgewählten Tage",
    selectedDays: "Ausgewählte Tage",
    selectColor: "Farbe wählen",
    tagLabel: "Tag/Etikett (optional)",
    tagPlaceholder: "z.B. Urlaub, Arbeit, etc.",
    daysSelected: "{{count}} Tag(e) ausgewählt",
    daysSelected_plural: "{{count}} Tag(e) ausgewählt",
    apply: "Anwenden",
  },
  settings: {
    title: "App-Einstellungen",
    description: "Passen Sie Ihre App-Einstellungen an",
    subtitle: "Anpassen Sie Ihr Erlebnis",
    settings: "Einstellungen",
    profile: "Profil",
    preferences: "Präferenzen",
    weekStartsOnMonday: "Woche beginnt am:",
    mondayFirst: "Montag ist der erste Tag",
    sundayFirst: "Sonntag ist der erste Tag",
    changePassword: "Passwort ändern",
    newPassword: "Neues Passwort",
    clearAllData: "Alle Daten löschen",
    deleteAccount: "Konto löschen",
    confirmDelete: "Geben Sie 'DELETE' ein, um zu bestätigen",
    saveChanges: "Änderungen speichern",
    logoutButton: "Abmelden",
    appearance: {
      title: "Erscheinungsbild",
    },
    theme: {
      title: "Design",
      description: "Wählen Sie Ihr Farbschema",
      light: "Hell",
      dark: "Dunkel",
      system: "System",
    },
    language: {
      title: "Sprache",
    },
    calendar: {
      title: "Kalender",
    },
    weekStart: {
      title: "Woche beginnt am:",
      description: "Ändern Sie den Wochenanfangstag",
      monday: "Mo",
      sunday: "So",
    },
    account: {
      title: "Konto",
    },
    subscription: "Abonnement",
    clearData: {
      title: "Alle Daten löschen",
      confirm: "Sind Sie sicher, dass Sie alle Kalenderdaten löschen möchten? Dies kann nicht rückgängig gemacht werden.",
      success: "Alle Daten erfolgreich gelöscht",
      error: "Fehler beim Löschen der Daten",
    },
    legal: {
      title: "Andere",
    },
    termsOfService: "Nutzungsbedingungen",
    privacyPolicy: "Datenschutzrichtlinie",
    logout: "Abmelden",
  },
  subscription: {
    title: "Abonnement",
    loading: "Lädt...",
    manageDescription:
      "Verwalten Sie Ihr Abonnement und die Abrechnung",
    status: "Status",
    statusActive: "Premium Aktiv",
    statusTrial: "Kostenlose Testversion",
    statusInactive: "Kein Aktives Abonnement",
    plan: "Plan",
    renewsOn: "Verlängert am",
    expiresOn: "Läuft ab am",
    trialActive: "Noch {{days}} Tage Testversion",
    trialActiveTitle: "Kostenlose Testversion aktiv",
    trialDaysRemaining:
      "Tages der Testversion übrig",
    trialEndsOn: "Testversion endet am",
    premiumAccess: "Voller Zugriff auf alle Funktionen",
    upgradeToPremium: "Upgraden, um alle Funktionen freizuschalten",
    trialDescription:
      "Subskribieren Sie, um vollen Zugriff auf Pilliox zu erhalten und die weitere Entwicklung zu unterstützen",
    trialExpired: "Ihre Testversion ist abgelaufen",
    subscribeCTA: "Abonnieren - €2,99/Monat",
    subscribeToAccess:
      "Abonnieren Sie, um weiter Einträge hinzuzufügen",
    subscribeNow: "Jetzt abonnieren",
    upgradeNow: "Auf Premium upgraden",
    manageSubscription: "Abonnement verwalten",
    manage: "Abonnement verwalten",
    syncSubscription: "Sync erzwingen",
    logout: "Abmelden",
    paywallTitle: "Testversion beendet",
    paywallDescription:
      "Ihre 3-tägige Testversion ist abgelaufen. Abonnieren Sie, um weiterhin Ihre Gesundheitsdaten zu verfolgen.",
    premiumFeatures: "Premium-Funktionen",
    premiumDescription: "Entfalten Sie das volle Potenzial von Pilliox",
    feature1: "Unbegrenzte Medikamentenverfolgung",
    feature2: "INR- und Blutwertüberwachung",
    feature3: "Intelligente Benachrichtigungen und Erinnerungen",
    feature4: "Mehrtägige Farbcodierung für Behandlungszeiträume",
    feature5: "Datenexport und Backup",
    feature6: "Prioritäts-Kundensupport",
    month: "Monat",
    cancelAnytime: "Jederzeit kündbar, keine Verpflichtung",
    startFreeTrial: "3-Tage-Testversion starten",
    trialInfo: "Starten Sie Ihre 3-tägige kostenlose Testversion. Keine Kreditkarte im Voraus erforderlich.",
    pricing: "Jederzeit kündbar",
    billingInfo: "Abrechnung sicher über Stripe verwaltet",
  },
  profile: {
    title: "Profileinstellungen",
    subtitle: "Ihre Gesundheitsinformationen",
    description:
      "Verwalten Sie Ihre Kontoinformationen und Sicherheit",
    tabs: {
      profile: "Profil",
      security: "Sicherheit",
    },
    emailNotEditable: "E-Mail kann nicht geändert werden",
    namePlaceholder: "Ihr Name",
    noName: "Benutzer",
    dateOfBirth: "Gebutrsdatum",
    editProfile: "Profil bearbeiten",
    updateProfile: "Profil aktualisieren",
    updating: "Wird aktualisiert...",
    signOut: "Abmelden",
    logoutButton: "Vom Konto abmelden",
    changePassword: "Passwort ändern",
    newPassword: "Neues Passwort",
    newPasswordPlaceholder: "Neues Passwort eingeben",
    confirmPassword: "Neues Passwort bestätigen",
    confirmPasswordPlaceholder: "Passwort bestätigen",
    changePasswordButton: "Passwort ändern",
    changing: "Wird geändert...",
    passwordTooShort: "Passwort muss mindestens 6 Zeichen lang sein",
    passwordMismatch: "Passwörter stimmen nicht überein",
    passwordChanged: "Passwort erfolgreich geändert",
    passwordChangeFailed: "Passwortänderung fehlgeschlagen",
    dangerZone: "Gefahrenzone",
    deleteAccount: "Konto löschen",
    deleteWarning:
      "Diese Aktion kann nicht rückgängig gemacht werden. Alle Ihre Daten werden dauerhaft gelöscht. Geben Sie DELETE ein, um zu bestätigen.",
    deleteConfirmPlaceholder:
      "DELETE eingeben, um zu bestätigen",
    confirmDelete: "Löschen bestätigen",
    deleting: "Wird gelöscht...",
    stats: {
      entries: "Einträge gesamt",
      streak: "Tage-Streak",
      medications: "Medikamente",
    },
    health: {
      title: "Gesundheitsinformationen",
      comingSoon: "INR-Tracking und Blutwert-Historie demnächst verfügbar...",
    },
  },
  colors: {
    blue: "Blau",
    green: "Grün",
    yellow: "Gelb",
    red: "Rot",
    purple: "Lila",
    none: "Keine",
  },
  medications: {
    title: "Medikamente",
    subtitle: "Verwalten Sie Ihre Medikamente",
    add: "Hinzufügen",
    pills: "Tabletten",
    values: "Medizinische Werte",
    empty: {
      title: "Noch keine Medikamente",
      description: "Fügen Sie Ihr erstes Medikament hinzu, um mit der Verfolgung zu beginnen",
    },
    addFirst: "Ihr erstes Medikament hinzufügen",
        emtpyAdHoc: {
      title: "Keine einmaligen Medikamente",
      description:
        "Fügen Sie ein einziges Medikament für besondere Anlässe oder temporäre Behandlungen hinzu",
    },
  },
  common: {
    loading: "Laden...",
    saving: "Speichern...",
    save: "Speichern",
    cancel: "Abbrechen",
  },
  pillsSettings: {
    title: "Medikamenteneinstellungen",
    subtitle: "Verwalten Sie Ihre Medikamente und Werte",
    addMedication: "Medikament hinzufügen",
    editMedication: "Medikament bearbeiten",
    addMedicationDescription: "Fügen Sie ein neues Medikament hinzu",
    editMedicationDescription: "Bearbeiten Sie Ihre Medikamenteneinstellungen",
    medicationName: "Medikamentenname",
    medicationPlaceholder: "Medikamentennamen eingeben",
    nameAndColor: "Name & Farbe",
    typeAndSchedule: "Typ & Zeitplan",
    color: "Farbe",
    type: "Typ",
    typePills: "Medikament",
    typeValue: "Wert",
    unit: "Einheit",
    defaultDosage: "Standarddosis",
    defaultValue: "Standardwert",
    notifications: "Benachrichtigungen",
    daily: "Täglich",
    every2days: "Alle 2 Tage",
    every3days: "Alle 3 Tage",
    saveChanges: "Änderungen speichern",
    discard: "Verwerfen",
    noPills: "Noch keine Medikamente",
    deleteMedication: "Medikament löschen",
    deleteConfirmTitle: "Medikament löschen?",
    deleteConfirmDescription: "Dieses Medikament hat {count} Kalendereinträge. Alle Einträge werden dauerhaft gelöscht.",
    deleteConfirmNoEntries: "Sind Sie sicher, dass Sie dieses Medikament löschen möchten?",
    deleteKeywordPrompt: "Geben Sie 'LÖSCHEN' ein, um zu bestätigen",
    deleteKeywordPlaceholder: "LÖSCHEN eingeben",
    deleteKeywordMismatch: "Bitte geben Sie LÖSCHEN ein, um zu bestätigen",
    deleteSuccess: "Medikament erfolgreich gelöscht",
    deleteError: "Fehler beim Löschen des Medikaments",
    cancel: "Abbrechen",
    confirmDelete: "Löschen bestätigen",
  },
  deleteConfirm: {
    title: "Tag entfernen",
    description:
      "Wählen Sie, wie Sie dieses Tag entfernen möchten:",
    thisDay: "Nur dieser Tag",
    thisDayDescription:
      "Tag nur vom ausgewählten Tag entfernen",
    allDays: "Alle markierten Tage",
    allDaysDescription:
      "Tag von allen Tagen mit derselben Farbe und Beschriftung entfernen",
    cancel: "Abbrechen",
  },
  dataRange: {
    prefill: "Ausfüllen",
    dont: "Nicht",
    thisWeek: "Woche",
    thisMonth: "Monat",
    thisYear: "Jahr",
    range: "Bereich",
  },
  schedule: {
    title: "Zeitplan",
    editSchedule: "Zeitplan bearbeiten",
    addSchedule: "Zeitplan hinzufügen",
    scheduleFrequency: "Zeitplantyp",
    daily: "Täglich",
    everyXDays: "Alle paar Tage",
    cyclic: "Zyklisch",
    specificDays: "Bestimmte Tage",
    asNeeded: "Bei Bedarf",
    customDescription: "Wählen Sie bestimmte Tage für dieses Medikament",
    selectDays: "Tage auswählen",
    noSchedule: "Noch kein Zeitplan",
    tapToSet: "Tippen, um den Zeitplan festzulegen",
    frequency: "Häufigkeit",
    frequencyDescription: "Wählen Sie, wie dieses Medikament im Zeitplan erscheinen soll.",
    dailyDescription: "Nehmen Sie dieses Medikament jeden Tag ein.",
    cyclicDescription: "Nach einer eigenen Anzahl von Tagen wiederholen.",
    specificDaysDescription: "Wählen Sie die Wochentage, an denen dieses Medikament geplant ist.",
    asNeededDescription: "Kein fester Zeitplan. Nur protokollieren, wenn Sie es einnehmen.",
    days: "Tage",
    timesAndDoses: "Zeiten & Dosen",
  },
  about: {
    title: "Über Pilliox",
    description: "Ihr medizinischer Tracking-Begleiter",
    tagline:
      "Verfolgen Sie Ihre medizinischen Werte mit Leichtigkeit und Präzision",
    features: "Hauptfunktionen:",
    feature1: "INR-Werte und Bluttestergebnisse verfolgen",
    feature2:
      "Tägliche Medikamente mit Tablettenzähler überwachen",
    feature3:
      "Behandlungsperioden mit benutzerdefinierten Tags farblich kennzeichnen",
    feature4:
      "Sichere Cloud-Sicherung Ihrer medizinischen Daten",
    visitHomepage: "Homepage besuchen",
    close: "Schließen",
  },
  days: {
    monday: "Montag",
    tuesday: "Dienstag",
    wednesday: "Mittwoch",
    thursday: "Donnerstag",
    friday: "Freitag",
    saturday: "Samstag",
    sunday: "Sonntag",
    mon: "Mo",
    tue: "Di",
    wed: "Mi",
    thu: "Do",
    fri: "Fr",
    sat: "Sa",
    sun: "So",
  },
  months: {
    january: "Januar",
    february: "Februar",
    march: "März",
    april: "April",
    may: "Mai",
    june: "Juni",
    july: "Juli",
    august: "August",
    september: "September",
    october: "Oktober",
    november: "November",
    december: "Dezember",
  },
  docs: {
    back: "Zurück",
    lastUpdated: "Zuletzt aktualisiert",
    termsOfService: {
      title: "Nutzungsbedingungen",
      lastUpdated: "6. Februar 2026",
      acceptance: {
        title: "1. Annahme der Bedingungen",
        content:
          "Durch den Zugriff auf und die Nutzung von Pilliox erklären Sie sich mit diesen Nutzungsbedingungen einverstanden. Wenn Sie mit diesen Bedingungen nicht einverstanden sind, verwenden Sie die App bitte nicht.",
      },
      description: {
        title: "2. Beschreibung des Dienstes",
        content:
          "Pilliox ist eine medizinische Tracking-Kalenderanwendung, die Ihnen hilft zu überwachen:",
        features: {
          calendar:
            "Tägliche Ereignisse und farbcodierte Tagesmarkierungen",
          medications: "Medikamenteneinnahme mit Pillenzähler",
          expenses:
            "INR (International Normalized Ratio) Bluttestwerte",
          notes: "Persönliche Notizen und Tags für jeden Tag",
        },
      },
      userAccount: {
        title: "3. Benutzerkonten",
        content:
          "Sie sind dafür verantwortlich, die Vertraulichkeit Ihrer Kontoanmeldeinformationen zu wahren. Sie verpflichten sich, uns unverzüglich über jede unbefugte Nutzung Ihres Kontos zu informieren. Wir behalten uns das Recht vor, Konten zu kündigen, die gegen diese Bedingungen verstoßen.",
      },
      userData: {
        title: "4. Benutzerdaten",
        content:
          "Sie behalten alle Rechte an den Daten, die Sie in Pilliox eingeben. Wir speichern Ihre Daten sicher und geben sie nicht ohne Ihre Zustimmung an Dritte weiter, außer wenn dies gesetzlich vorgeschrieben ist. Sie können Ihr Konto und alle zugehörigen Daten jederzeit über die App-Einstellungen löschen.",
      },
      disclaimer: {
        title: "5. Medizinischer Haftungsausschluss",
        content:
          "Pilliox ist kein medizinisches Gerät und sollte nicht als Ersatz für professionelle medizinische Beratung, Diagnose oder Behandlung verwendet werden. Die INR-Tracking- und Medikamentenfunktionen dienen nur zur persönlichen Aufzeichnung. Eingegebene INR-Werte werden nicht validiert und sollten keine regelmäßigen Bluttests durch medizinisches Fachpersonal ersetzen. Konsultieren Sie immer Ihren Gesundheitsdienstleister für medizinische Entscheidungen und ordnungsgemäße Antikoagulationstherapie.",
      },
      liability: {
        title: "6. Haftungsbeschränkung",
        content:
          "Pilliox wird 'wie besehen' ohne jegliche Garantien bereitgestellt. Wir haften nicht für Schäden, die durch die Nutzung oder Unfähigkeit zur Nutzung der App entstehen, einschließlich, aber nicht beschränkt auf Datenverlust, verpasste Medikamentenerinnerungen, fehlerhafte INR-Werteinträge oder medizinische Komplikationen. Benutzer sind allein verantwortlich für ihr Gesundheitsmanagement und medizinische Entscheidungen.",
      },
      changes: {
        title: "7. Änderungen der Bedingungen",
        content:
          "Wir behalten uns das Recht vor, diese Bedingungen jederzeit zu ändern. Wir werden Benutzer über wesentliche Änderungen per E-Mail oder In-App-Benachrichtigung informieren. Die fortgesetzte Nutzung der App nach Änderungen stellt die Annahme der neuen Bedingungen dar.",
      },
      contact: {
        title: "8. Kontaktinformationen",
        content:
          "Bei Fragen zu diesen Nutzungsbedingungen kontaktieren Sie uns bitte unter support@pilliox.com",
      },
    },
    privacyPolicy: {
      title: "Datenschutzrichtlinie",
      lastUpdated: "6. Februar 2026",
      introduction: {
        title: "1. Einleitung",
        content:
          "Diese Datenschutzrichtlinie erklärt, wie Pilliox Ihre persönlichen Informationen sammelt, verwendet, speichert und schützt. Wir sind verpflichtet, Ihre Privatsphäre zu gewährleisten und Ihre Daten zu schützen.",
      },
      dataCollection: {
        title: "2. Informationen, die wir sammeln",
        content:
          "Wir sammeln die folgenden Arten von Informationen:",
        items: {
          account:
            "Kontoinformationen: E-Mail-Adresse, Name und Authentifizierungsdaten",
          calendar:
            "Kalenderdaten: Daten, Farbcodes und Tags, die Sie Tagen zuweisen",
          medications:
            "Medikamentendaten: Pillenzählungen und Medikamentenverfolgungsinformationen",
          expenses:
            "Medizinische Daten: INR (International Normalized Ratio) Bluttestwerte, die Sie zur Verfolgung eingeben",
          notes:
            "Notizen: Persönliche Notizen, die Sie zu Kalendertagen hinzufügen",
        },
      },
      dataUsage: {
        title: "3. Wie wir Ihre Informationen verwenden",
        content: "Wir verwenden Ihre Informationen, um:",
        items: {
          service:
            "Den Pilliox-Dienst bereitzustellen und zu pflegen",
          improve:
            "Ihre Erfahrung zu verbessern und zu personalisieren",
          support: "Kundensupport bereitzustellen",
          communicate:
            "Wichtige Updates über den Dienst zu senden",
        },
      },
      dataStorage: {
        title: "4. Datenspeicherung und -sicherheit",
        content:
          "Ihre Daten werden sicher mit der Supabase-Infrastruktur unter Verwendung branchenüblicher Verschlüsselung gespeichert. Wir implementieren geeignete technische und organisatorische Maßnahmen, um Ihre Daten vor unbefugtem Zugriff, Änderung, Offenlegung oder Zerstörung zu schützen.",
      },
      dataSharing: {
        title: "5. Datenweitergabe",
        content:
          "Wir verkaufen, tauschen oder vermieten Ihre persönlichen Informationen nicht an Dritte. Wir können Ihre Informationen nur unter den folgenden Umständen weitergeben: mit Ihrer ausdrücklichen Zustimmung, zur Erfüllung gesetzlicher Verpflichtungen oder zum Schutz unserer Rechte und Sicherheit.",
      },
      dataSecurity: {
        title: "6. Datensicherheit",
        content:
          "Wir verwenden sichere HTTPS-Verbindungen, verschlüsselte Speicherung und Authentifizierungstoken, um Ihre Daten zu schützen. Keine Übertragungsmethode über das Internet ist jedoch zu 100% sicher, und wir können keine absolute Sicherheit garantieren.",
      },
      userRights: {
        title: "7. Ihre Rechte",
        content: "Sie haben das Recht:",
        items: {
          access: "Auf Ihre persönlichen Daten zuzugreifen",
          correction: "Unrichtige Daten zu korrigieren",
          deletion:
            "Ihr Konto und alle zugehörigen Daten zu löschen",
          export:
            "Ihre Daten in einem portabilen Format zu exportieren",
        },
      },
      cookies: {
        title: "8. Cookies und lokale Speicherung",
        content:
          "Wir verwenden lokale Speicherung und Sitzungstoken, um Ihren Anmeldestatus und App-Einstellungen beizubehalten. Diese sind für die Funktion der App wesentlich und werden nicht zu Tracking-Zwecken verwendet.",
      },
      thirdParty: {
        title: "9. Drittanbieterdienste",
        content:
          "Wir verwenden Google OAuth zur Authentifizierung. Wenn Sie sich mit Google anmelden, unterliegen Sie der Datenschutzrichtlinie von Google. Wir erhalten nur grundlegende Profilinformationen (E-Mail und Name) mit Ihrer Erlaubnis.",
      },
      children: {
        title: "10. Datenschutz für Kinder",
        content:
          "Pilliox ist nicht für Kinder unter 13 Jahren bestimmt. Wir sammeln wissentlich keine persönlichen Informationen von Kindern unter 13 Jahren. Wenn Sie glauben, dass wir Informationen von einem Kind gesammelt haben, kontaktieren Sie uns bitte sofort.",
      },
      changes: {
        title: "11. Änderungen der Datenschutzrichtlinie",
        content:
          "Wir können diese Datenschutzrichtlinie von Zeit zu Zeit aktualisieren. Wir werden Sie über wesentliche Änderungen per E-Mail oder über die App benachrichtigen. Das Datum 'Zuletzt aktualisiert' oben in dieser Richtlinie gibt an, wann sie zuletzt überarbeitet wurde.",
      },
      contact: {
        title: "12. Kontakt",
        content:
          "Wenn Sie Fragen zu dieser Datenschutzrichtlinie oder wie wir mit Ihren Daten umgehen haben, kontaktieren Sie uns bitte unter privacy@pilliox.com",
      },
    },
  },
  onboarding: {
    skip: "Überspringen",
    next: "Weiter",
    getStarted: "Loslegen",
    step1: {
      title: "Verfolgen Sie Ihre Gesundheit",
      description: "Verfolgen Sie Ihre INR-Werte, Bluttests und Medikamentenpläne an einem Ort.",
    },
    step2: {
      title: "Medikamente verwalten",
      description: "Richten Sie Ihre Medikamente mit individuellen Dosierungen und Zeitplänen ein. Verpassen Sie nie wieder eine Dosis.",
    },
    step3: {
      title: "Intelligente Erinnerungen",
      description: "Erhalten Sie rechtzeitige Benachrichtigungen für Ihre Medikamente und Gesundheitstermine.",
    },
    step4: {
      title: "Sicher & Privat",
      description: "Ihre Gesundheitsdaten sind verschlüsselt und sicher gespeichert. Nur Sie haben Zugriff auf Ihre Informationen.",
    },
  },
  cookies: {
    title: "Wir legen Wert auf Ihre Privatsphäre",
    description:
      "Wir verwenden Cookies und lokale Speicherung, um wesentliche App-Funktionen bereitzustellen, einschließlich Authentifizierung und Speicherung Ihrer Einstellungen. Wir verwenden keine Cookies für Tracking oder Werbung.",
    accept: "Akzeptieren",
    decline: "Ablehnen",
    learnMore: "Mehr erfahren",
  },
} as const;
