import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Trash2 } from "lucide-react";

interface NoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: string;
  onSave: (note: string) => void;
}

export function NoteDialog({ open, onOpenChange, note, onSave }: NoteDialogProps) {
  const { t } = useTranslation();
  const [tempNote, setTempNote] = useState(note);

  useEffect(() => {
    if (open) setTempNote(note);
  }, [open, note]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="small">
        <DialogHeader>
          <DialogTitle className="text-foreground">{t("calendar.note")}</DialogTitle>
        </DialogHeader>
        <Textarea
          placeholder={t("day.notePlaceholder")}
          value={tempNote}
          onChange={(e) => setTempNote(e.target.value)}
          rows={5}
          className="resize-none"
          autoFocus
        />
        <div className="flex gap-2">
          {tempNote && (
            <Button
              variant="destructive"
              onClick={() => {
                onSave("");
                onOpenChange(false);
              }}
            >
              <Trash2 className="size-4" />
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            {t("basic.cancel")}
          </Button>
          <Button
            onClick={() => {
              onSave(tempNote);
              onOpenChange(false);
            }}
            className="flex-1"
          >
            {t("basic.save") || "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
