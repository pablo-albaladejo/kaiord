import { Toast } from "../../atoms/Toast";
import type { ToastItem } from "../../../hooks/useToast";

type SaveButtonToastsProps = {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
};

export function SaveButtonToasts({ toasts, onDismiss }: SaveButtonToastsProps) {
  return (
    <>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          title={toast.title}
          description={toast.description}
          variant={toast.variant}
          action={toast.action}
          open={toast.open}
          onOpenChange={(open) => {
            if (!open) onDismiss(toast.id);
          }}
          duration={toast.duration}
        />
      ))}
    </>
  );
}
