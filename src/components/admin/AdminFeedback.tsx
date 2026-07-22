"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Icon } from "@/components/shared/Icon";

/**
 * Feedback unificado del admin: toasts + diálogos de confirmación/prompt
 * propios (adiós window.confirm/prompt nativos de Chrome). Cero dependencias.
 *
 * Criterio de uso (no hacer ruido):
 *  - toast.success: SOLO acciones discretas (crear, eliminar, subir, portada).
 *  - toast.error: cualquier fallo, incluidos los blur-saves silenciosos.
 *  - Los errores de validación de formularios siguen inline (setError) — el
 *    toast complementa, no reemplaza.
 *
 * Motion: transitions CSS (interrumpibles), ease-out, entrada <250ms, salida
 * más rápida. Sin loops infinitos (principio de honestidad del proyecto).
 * A11y: toasts en aria-live=polite; diálogos con role=dialog, foco inicial,
 * Escape para cancelar y restauración de foco al cerrar.
 */

type ToastKind = "success" | "error";
interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
  leaving?: boolean;
}

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Acción destructiva: botón rojo y foco inicial en Cancelar. */
  destructive?: boolean;
}

interface PromptOptions {
  title: string;
  message?: string;
  placeholder?: string;
  confirmLabel?: string;
  initialValue?: string;
}

interface FeedbackApi {
  toast: (kind: ToastKind, message: string) => void;
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
  promptText: (opts: PromptOptions) => Promise<string | null>;
}

const FeedbackContext = createContext<FeedbackApi | null>(null);

export function useAdminFeedback(): FeedbackApi {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error("useAdminFeedback requiere <AdminFeedbackProvider> en el layout admin.");
  return ctx;
}

const TOAST_MS = 3500;
const TOAST_EXIT_MS = 160;

type DialogState =
  | { type: "confirm"; opts: ConfirmOptions; resolve: (v: boolean) => void }
  | { type: "prompt"; opts: PromptOptions; resolve: (v: string | null) => void }
  | null;

export function AdminFeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [dialog, setDialog] = useState<DialogState>(null);
  const idRef = useRef(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const promptInputRef = useRef<HTMLInputElement>(null);

  const dismissToast = useCallback((id: number) => {
    // Salida en dos tiempos: marca leaving (transición CSS) y después remueve.
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), TOAST_EXIT_MS);
  }, []);

  const toast = useCallback(
    (kind: ToastKind, message: string) => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev.slice(-3), { id, kind, message }]); // máx 4 visibles
      setTimeout(() => dismissToast(id), TOAST_MS);
    },
    [dismissToast]
  );

  const confirm = useCallback((opts: ConfirmOptions) => {
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    return new Promise<boolean>((resolve) => setDialog({ type: "confirm", opts, resolve }));
  }, []);

  const promptText = useCallback((opts: PromptOptions) => {
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    return new Promise<string | null>((resolve) => setDialog({ type: "prompt", opts, resolve }));
  }, []);

  const closeDialog = useCallback(
    (result: boolean | string | null) => {
      if (!dialog) return;
      if (dialog.type === "confirm") dialog.resolve(Boolean(result));
      else dialog.resolve(typeof result === "string" ? result : null);
      setDialog(null);
      restoreFocusRef.current?.focus({ preventScroll: true });
    },
    [dialog]
  );

  // Foco inicial + Escape. En destructivo el foco arranca en Cancelar (anti-Enter fatal).
  useEffect(() => {
    if (!dialog) return;
    const node = dialogRef.current;
    const raf = requestAnimationFrame(() => {
      if (dialog.type === "prompt") promptInputRef.current?.focus();
      else {
        const sel = dialog.opts.destructive ? "[data-cancel]" : "[data-confirm]";
        node?.querySelector<HTMLElement>(sel)?.focus();
      }
    });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeDialog(dialog.type === "confirm" ? false : null);
      }
      if (e.key !== "Tab" || !node) return;
      // Trap simple: mantiene el Tab dentro del diálogo.
      const items = Array.from(
        node.querySelectorAll<HTMLElement>('button, input, [tabindex]:not([tabindex="-1"])')
      ).filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const i = items.indexOf(document.activeElement as HTMLElement);
      if (e.shiftKey && (i === 0 || i === -1)) {
        e.preventDefault();
        items[items.length - 1].focus();
      } else if (!e.shiftKey && i === items.length - 1) {
        e.preventDefault();
        items[0].focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
    };
  }, [dialog, closeDialog]);

  return (
    <FeedbackContext.Provider value={{ toast, confirm, promptText }}>
      {children}

      {/* ---- Toasts ---- */}
      <div className="atoasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`atoast ${t.kind}${t.leaving ? " leaving" : ""}`}>
            <Icon name={t.kind === "success" ? "check" : "close"} size={15} />
            <span>{t.message}</span>
            <button type="button" aria-label="Cerrar aviso" onClick={() => dismissToast(t.id)}>
              <Icon name="close" size={13} />
            </button>
          </div>
        ))}
      </div>

      {/* ---- Diálogo confirm / prompt ---- */}
      {dialog && (
        <div
          className="adlg-overlay"
          onClick={() => closeDialog(dialog.type === "confirm" ? false : null)}
        >
          <div
            className="adlg"
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={dialog.opts.title}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="adlg-title">{dialog.opts.title}</h3>
            {dialog.opts.message && <p className="adlg-msg">{dialog.opts.message}</p>}

            {dialog.type === "prompt" ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const v = promptInputRef.current?.value.trim();
                  if (v) closeDialog(v);
                }}
              >
                <input
                  ref={promptInputRef}
                  className="adlg-input"
                  placeholder={dialog.opts.placeholder}
                  defaultValue={dialog.opts.initialValue ?? ""}
                />
                <div className="adlg-actions">
                  <button type="button" className="abtn abtn-ghost" data-cancel onClick={() => closeDialog(null)}>
                    Cancelar
                  </button>
                  <button type="submit" className="abtn abtn-primary" data-confirm>
                    {dialog.opts.confirmLabel ?? "Crear"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="adlg-actions">
                <button type="button" className="abtn abtn-ghost" data-cancel onClick={() => closeDialog(false)}>
                  {dialog.opts.cancelLabel ?? "Cancelar"}
                </button>
                <button
                  type="button"
                  className={"abtn " + (dialog.opts.destructive ? "abtn-destructive" : "abtn-primary")}
                  data-confirm
                  onClick={() => closeDialog(true)}
                >
                  {dialog.opts.confirmLabel ?? "Confirmar"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </FeedbackContext.Provider>
  );
}
