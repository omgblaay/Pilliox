import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Logo } from "./Logo";

interface AboutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AboutModal({ open, onOpenChange }: AboutModalProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="small" className="bg-card border-border">
        <DialogHeader>
          <DialogTitle>{t("about.title")}</DialogTitle>
          <DialogDescription className="sr-only">
            {t("about.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="flex flex-col gap-3 pb-2">
            <div className="h-[40px] w-[160px]">
              <Logo />
            </div>
            <p className="text-sm text-muted-foreground text-left">
              {t("about.description")}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {t("about.features")}
            </p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 mt-0.5 text-[#9810FA] flex-shrink-0" />
                <span>{t("about.feature1")}</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 mt-0.5 text-[#9810FA] flex-shrink-0" />
                <span>{t("about.feature2")}</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 mt-0.5 text-[#9810FA] flex-shrink-0" />
                <span>{t("about.feature3")}</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 mt-0.5 text-[#9810FA] flex-shrink-0" />
                <span>{t("about.feature4")}</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-4">
            <Button
              variant="secondary"
              onClick={() => navigate("/landing")}
            >
              {t("about.visitHomepage")}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              {t("about.close")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
