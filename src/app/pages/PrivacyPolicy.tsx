import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";
import { LanguageSelector } from "../components/LanguageSelector";

interface PrivacyPolicyProps {
  onBack: () => void;
}

export function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div>
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            onClick={onBack}
            variant="ghost"
            className="w-auto"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="w-auto">{t("docs.back")}</span>
          </Button>
          <LanguageSelector className="flex-1" />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 pb-4">
        <div className="bg-popover rounded-2xl shadow-sm border border-border p-4 sm:p-8 overflow-y-auto max-h-[calc(100vh-8rem)]">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {t("docs.privacyPolicy.title")}
          </h1>
          <p className="text-sm text-muted-foreground mb-8">
            {t("docs.lastUpdated")}:{" "}
            {t("docs.privacyPolicy.lastUpdated")}
          </p>

          <div className="space-y-8 text-foreground/90">
            {/* Section 1 */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                {t("docs.privacyPolicy.introduction.title")}
              </h2>
              <p className="leading-relaxed">
                {t("docs.privacyPolicy.introduction.content")}
              </p>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                {t("docs.privacyPolicy.dataCollection.title")}
              </h2>
              <p className="leading-relaxed mb-4">
                {t("docs.privacyPolicy.dataCollection.content")}
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  {t(
                    "docs.privacyPolicy.dataCollection.items.account",
                  )}
                </li>
                <li>
                  {t(
                    "docs.privacyPolicy.dataCollection.items.calendar",
                  )}
                </li>
                <li>
                  {t(
                    "docs.privacyPolicy.dataCollection.items.medications",
                  )}
                </li>
                <li>
                  {t(
                    "docs.privacyPolicy.dataCollection.items.expenses",
                  )}
                </li>
                <li>
                  {t(
                    "docs.privacyPolicy.dataCollection.items.notes",
                  )}
                </li>
              </ul>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                {t("docs.privacyPolicy.dataUsage.title")}
              </h2>
              <p className="leading-relaxed mb-4">
                {t("docs.privacyPolicy.dataUsage.content")}
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  {t(
                    "docs.privacyPolicy.dataUsage.items.service",
                  )}
                </li>
                <li>
                  {t(
                    "docs.privacyPolicy.dataUsage.items.improve",
                  )}
                </li>
                <li>
                  {t(
                    "docs.privacyPolicy.dataUsage.items.support",
                  )}
                </li>
                <li>
                  {t(
                    "docs.privacyPolicy.dataUsage.items.communicate",
                  )}
                </li>
              </ul>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                {t("docs.privacyPolicy.dataStorage.title")}
              </h2>
              <p className="leading-relaxed">
                {t("docs.privacyPolicy.dataStorage.content")}
              </p>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                {t("docs.privacyPolicy.dataSharing.title")}
              </h2>
              <p className="leading-relaxed">
                {t("docs.privacyPolicy.dataSharing.content")}
              </p>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                {t("docs.privacyPolicy.dataSecurity.title")}
              </h2>
              <p className="leading-relaxed">
                {t("docs.privacyPolicy.dataSecurity.content")}
              </p>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                {t("docs.privacyPolicy.userRights.title")}
              </h2>
              <p className="leading-relaxed mb-4">
                {t("docs.privacyPolicy.userRights.content")}
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  {t(
                    "docs.privacyPolicy.userRights.items.access",
                  )}
                </li>
                <li>
                  {t(
                    "docs.privacyPolicy.userRights.items.correction",
                  )}
                </li>
                <li>
                  {t(
                    "docs.privacyPolicy.userRights.items.deletion",
                  )}
                </li>
                <li>
                  {t(
                    "docs.privacyPolicy.userRights.items.export",
                  )}
                </li>
              </ul>
            </section>

            {/* Section 8 */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                {t("docs.privacyPolicy.cookies.title")}
              </h2>
              <p className="leading-relaxed">
                {t("docs.privacyPolicy.cookies.content")}
              </p>
            </section>

            {/* Section 9 */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                {t("docs.privacyPolicy.thirdParty.title")}
              </h2>
              <p className="leading-relaxed">
                {t("docs.privacyPolicy.thirdParty.content")}
              </p>
            </section>

            {/* Section 10 */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                {t("docs.privacyPolicy.children.title")}
              </h2>
              <p className="leading-relaxed">
                {t("docs.privacyPolicy.children.content")}
              </p>
            </section>

            {/* Section 11 */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                {t("docs.privacyPolicy.changes.title")}
              </h2>
              <p className="leading-relaxed">
                {t("docs.privacyPolicy.changes.content")}
              </p>
            </section>

            {/* Section 12 */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                {t("docs.privacyPolicy.contact.title")}
              </h2>
              <p className="leading-relaxed">
                {t("docs.privacyPolicy.contact.content")}
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}