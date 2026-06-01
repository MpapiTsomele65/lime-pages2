"use client";

/**
 * FormInput — the canonical dark-theme form field used across the
 * marketing site's modals + onboarding flows.
 *
 * Encapsulates the styling pattern that was previously duplicated
 * inline across 6+ components (the most prolific: ReferralFormModal
 * with 5 nearly-identical input declarations).
 *
 * What's standardised:
 *   • Wrapper layout — label, input, hint/error stack
 *   • Surface — `bg-white/[0.04]` with `border-white/[0.1]`
 *   • Focus — `lime/40` border + soft ring (tokens, not hex)
 *   • Required indicator — lime asterisk after the label
 *   • Accessibility — `aria-required`, `aria-invalid`, and
 *     `aria-describedby` wiring for hint / error text
 *   • Textarea support via `as="textarea"` (preserves the same
 *     visual treatment for the multi-line case)
 *
 * Visual output is byte-equivalent to the inline patterns it
 * replaces, except focus / error styles now route through tokens
 * so future palette tweaks propagate automatically.
 */

import { forwardRef } from "react";

type CommonProps = {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  disabled?: boolean;
  autoComplete?: string;
  className?: string;
};

type InputModeProps = CommonProps & {
  as?: "input";
  type?: "text" | "email" | "tel" | "number" | "password" | "url";
  rows?: never;
};

type TextareaModeProps = CommonProps & {
  as: "textarea";
  type?: never;
  rows?: number;
};

export type FormInputProps = InputModeProps | TextareaModeProps;

const BASE =
  "w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-lime/40 focus:ring-2 focus:ring-lime/15 transition-colors";

const ERROR_BORDER = "border-red-400/60 focus:border-red-400/70 focus:ring-red-400/15";

export const FormInput = forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  FormInputProps
>(function FormInput(props, ref) {
  const {
    label,
    name,
    value,
    onChange,
    placeholder,
    required = false,
    hint,
    error,
    disabled = false,
    autoComplete,
    className = "",
  } = props;
  const isTextarea = props.as === "textarea";

  // Stable IDs for ARIA wiring. If both hint and error are set, the
  // input announces both — error takes priority in the visual treatment.
  const hintId = hint ? `${name}-hint` : undefined;
  const errorId = error ? `${name}-error` : undefined;
  const describedBy =
    [errorId, hintId].filter(Boolean).join(" ") || undefined;

  const borderTreatment = error ? ERROR_BORDER : "";
  const resizeClass = isTextarea ? "resize-none" : "";
  const compositeClassName = [BASE, borderTreatment, resizeClass, className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={name}
        className="text-[12.5px] font-semibold uppercase tracking-[0.08em] text-white/55"
      >
        {label}
        {required && <span className="text-lime ml-1">*</span>}
      </label>

      {isTextarea ? (
        <textarea
          ref={ref as React.Ref<HTMLTextAreaElement>}
          id={name}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          rows={props.rows ?? 4}
          aria-required={required || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={compositeClassName}
        />
      ) : (
        <input
          ref={ref as React.Ref<HTMLInputElement>}
          id={name}
          name={name}
          type={(props as InputModeProps).type ?? "text"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          aria-required={required || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={compositeClassName}
        />
      )}

      {error && (
        <p
          id={errorId}
          role="alert"
          aria-live="polite"
          className="text-[12px] text-red-300 mt-0.5"
        >
          {error}
        </p>
      )}
      {!error && hint && (
        <p id={hintId} className="text-[12px] text-white/40 mt-0.5">
          {hint}
        </p>
      )}
    </div>
  );
});
