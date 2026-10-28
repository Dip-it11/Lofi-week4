"use client";

import { useId, type ReactNode } from "react";

/* Small, accessible form primitives for the component playgrounds. */

type FieldProps = { label: string; hint?: string; children: (id: string, hintId?: string) => ReactNode };

export function Field({ label, hint, children }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {children(id, hintId)}
      {hint && (
        <p id={hintId} className="text-xs text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}

const inputCls =
  "h-10 w-full rounded-lg border border-border bg-white px-3 text-sm text-foreground shadow-xs transition placeholder:text-muted/70 hover:border-[#cbbfe3] focus-visible:border-brand focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand/40 disabled:cursor-not-allowed disabled:bg-[#f4f1fa] disabled:text-muted disabled:hover:border-border";

export function TextInput({
  label,
  hint,
  value,
  onChange,
  disabled,
  placeholder,
  maxLength,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <Field label={label} hint={hint}>
      {(id, hintId) => (
        <input
          id={id}
          aria-describedby={hintId}
          type="text"
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          maxLength={maxLength}
          onChange={(e) => onChange(e.target.value)}
          className={inputCls}
        />
      )}
    </Field>
  );
}

export function Select<T extends string>({
  label,
  value,
  options,
  onChange,
  hint,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      {(id, hintId) => (
        <select
          id={id}
          aria-describedby={hintId}
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          className={`${inputCls} cursor-pointer appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 20 20%22 fill=%22%23351367%22><path d=%22M5.5 7.5l4.5 4.5 4.5-4.5%22 stroke=%22%23351367%22 stroke-width=%221.6%22 fill=%22none%22 stroke-linecap=%22round%22/></svg>')] bg-[length:1.1rem] bg-[right_0.6rem_center] bg-no-repeat pr-9`}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  const name = useId();
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-sm font-medium text-foreground">{label}</legend>
      <div className="grid auto-cols-fr grid-flow-col gap-1 rounded-lg border border-border bg-[#f4f1fa] p-1">
        {options.map((o) => (
          <label key={o.value} className="relative">
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              className="peer sr-only"
            />
            <span className="flex h-8 cursor-pointer items-center justify-center rounded-md px-2 text-center text-xs font-medium text-muted transition select-none peer-checked:bg-white peer-checked:text-brand peer-checked:shadow-sm peer-focus-visible:outline-2 peer-focus-visible:outline-brand hover:text-foreground sm:text-sm">
              {o.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function Switch({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
}) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <label htmlFor={id} className="cursor-pointer text-sm font-medium text-foreground">
          {label}
        </label>
        {hint && <p className="text-xs text-muted">{hint}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:scale-95 ${
          checked ? "bg-brand" : "bg-[#d8d0e8] hover:bg-[#cbbfe3]"
        }`}
      >
        <span
          aria-hidden
          className={`inline-block size-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5.5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

export function Range({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format = (v) => String(v),
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  return (
    <Field label={label}>
      {(id) => (
        <div className="flex items-center gap-3">
          <input
            id={id}
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            aria-valuetext={format(value)}
            className="h-2 w-full cursor-pointer accent-brand focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
          />
          <output htmlFor={id} className="w-12 shrink-0 text-right font-mono text-xs text-muted tabular-nums">
            {format(value)}
          </output>
        </div>
      )}
    </Field>
  );
}
