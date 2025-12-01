import { type ReactNode } from "react";
import {
  ToastContextProvider,
  useToastContext,
} from "../../contexts/ToastContext";
import { Toast, ToastProvider } from "../atoms/Toast";

function ToastRenderer() {
  const { toasts, dismiss } = useToastContext();

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
            if (!open) dismiss(toast.id);
          }}
          duration={toast.duration}
        />
      ))}
    </>
  );
}

export function AppToastProvider({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <ToastContextProvider>
        {children}
        <ToastRenderer />
      </ToastContextProvider>
    </ToastProvider>
  );
}
