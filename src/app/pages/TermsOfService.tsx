import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";
import { LanguageSelector } from "../components/LanguageSelector";

interface TermsOfServiceProps {
  onBack: () => void;
}

export function TermsOfService({
  onBack,
}: TermsOfServiceProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-background h-full">
      {/* Header */}
      <div className="sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            onClick={onBack}
            variant="ghost"
            className="w-auto"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="w-auto">{t("docs.back")}</span>
          </Button>
          <LanguageSelector />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto  px-4 pb-4">
        <div className="bg-popover rounded-2xl shadow-sm border border-border p-8 overflow-y-auto max-h-[calc(100vh-8rem)]">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {t("docs.termsOfService.title")}
          </h1>
          <p className="text-sm text-muted-foreground mb-8">
            {t("docs.lastUpdated")}:{" "}
            {t("docs.termsOfService.lastUpdated")}
          </p>

          <div className="space-y-8 text-foreground/90">
            {/* Section 1 */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                {t("docs.termsOfService.acceptance.title")}
              </h2>
              <p className="leading-relaxed">
                {t("docs.termsOfService.acceptance.content")}
              </p>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                {t("docs.termsOfService.description.title")}
              </h2>
              <p className="leading-relaxed mb-4">
                {t("docs.termsOfService.description.content")}
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  {t(
                    "docs.termsOfService.description.features.calendar",
                  )}
                </li>
                <li>
                  {t(
                    "docs.termsOfService.description.features.medications",
                  )}
                </li>
                <li>
                  {t(
                    "docs.termsOfService.description.features.expenses",
                  )}
                </li>
                <li>
                  {t(
                    "docs.termsOfService.description.features.notes",
                  )}
                </li>
              </ul>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                {t("docs.termsOfService.userAccount.title")}
              </h2>
              <p className="leading-relaxed">
                {t("docs.termsOfService.userAccount.content")}
              </p>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                {t("docs.termsOfService.userData.title")}
              </h2>
              <p className="leading-relaxed">
                {t("docs.termsOfService.userData.content")}
              </p>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                {t("docs.termsOfService.disclaimer.title")}
              </h2>
              <p className="leading-relaxed">
                {t("docs.termsOfService.disclaimer.content")}
              </p>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                {t("docs.termsOfService.liability.title")}
              </h2>
              <p className="leading-relaxed">
                {t("docs.termsOfService.liability.content")}
              </p>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                {t("docs.termsOfService.changes.title")}
              </h2>
              <p className="leading-relaxed">
                {t("docs.termsOfService.changes.content")}
              </p>
            </section>

            {/* Section 8 */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                {t("docs.termsOfService.contact.title")}
              </h2>
              <p className="leading-relaxed">
                {t("docs.termsOfService.contact.content")}
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}