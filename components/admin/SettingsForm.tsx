"use client";

import { useState } from "react";
import { saveSettingsCategoryAction } from "@/app/admin/settings/actions";
import { inputClass } from "./styles";

export interface SettingsFieldDef {
  key: string;
  label: string;
  type: "text" | "boolean" | "textarea";
  placeholder?: string;
  helpText?: string;
}

export function SettingsForm({
  category,
  fields,
  initialValues,
}: {
  category: string;
  fields: SettingsFieldDef[];
  initialValues: Record<string, string | boolean>;
}) {
  const [values, setValues] = useState<Record<string, string | boolean>>(initialValues);
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setValue(key: string, value: string | boolean) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    setSavedMessage(false);

    try {
      await saveSettingsCategoryAction(
        category,
        fields.map((field) => ({
          key: field.key,
          value: values[field.key] ?? (field.type === "boolean" ? false : ""),
        })),
      );
      setSavedMessage(true);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      {error && (
        <p className="mb-4 rounded-lg border border-primary bg-white px-4 py-2 text-sm font-medium text-black">
          <span aria-hidden="true">⚠ </span>
          {error}
        </p>
      )}

      <div className="rounded-xl border border-primary bg-white p-5">
        <div className="flex flex-col gap-4">
          {fields.map((field) => (
            <div key={field.key}>
              {field.type === "boolean" ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-black">{field.label}</p>
                    {field.helpText && <p className="text-xs text-primary-mid">{field.helpText}</p>}
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={Boolean(values[field.key])}
                    onClick={() => setValue(field.key, !values[field.key])}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                      values[field.key] ? "bg-secondary" : "bg-primary-mid"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                        values[field.key] ? "left-5" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>
              ) : (
                <>
                  <label className="block text-xs font-semibold text-primary-mid">{field.label}</label>
                  {field.type === "textarea" ? (
                    <textarea
                      value={String(values[field.key] ?? "")}
                      onChange={(event) => setValue(field.key, event.target.value)}
                      placeholder={field.placeholder}
                      rows={3}
                      className={`${inputClass} mt-1`}
                    />
                  ) : (
                    <input
                      value={String(values[field.key] ?? "")}
                      onChange={(event) => setValue(field.key, event.target.value)}
                      placeholder={field.placeholder}
                      className={`${inputClass} mt-1`}
                    />
                  )}
                  {field.helpText && <p className="mt-1 text-xs text-primary-mid">{field.helpText}</p>}
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          disabled={isSaving}
          onClick={() => void handleSave()}
          className="rounded-lg bg-secondary px-6 py-2.5 text-sm font-bold text-primary disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
        {savedMessage && <span className="text-sm font-semibold text-primary">✓ Settings updated</span>}
      </div>
    </div>
  );
}
