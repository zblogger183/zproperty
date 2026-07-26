"use client";

import { useRef, useState, useEffect } from "react";

export function OTPInput({
  length = 6,
  disabled = false,
  onComplete,
}: {
  length?: number;
  disabled?: boolean;
  onComplete: (code: string) => void;
}) {
  const [values, setValues] = useState<string[]>(() => Array(length).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  function commitDigit(index: number, digit: string) {
    setValues((current) => {
      const next = [...current];
      next[index] = digit;

      if (digit && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }

      if (next.every((value) => value !== "")) {
        onComplete(next.join(""));
      }

      return next;
    });
  }

  function handleChange(index: number, event: React.ChangeEvent<HTMLInputElement>) {
    const digit = event.target.value.replace(/\D/g, "").slice(-1);
    commitDigit(index, digit);
  }

  function handleKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !values[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (pasted.length !== length) return;

    event.preventDefault();
    setValues(pasted.split(""));
    inputRefs.current[length - 1]?.focus();
    onComplete(pasted);
  }

  return (
    <div className="flex justify-center gap-2.5">
      {values.map((value, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          value={value}
          disabled={disabled}
          onChange={(event) => handleChange(index, event)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          className="h-14 w-12 rounded-lg border-[1.5px] border-primary bg-white text-center text-[22px] font-bold text-black focus:border-2 focus:border-secondary focus:outline-none disabled:opacity-50"
        />
      ))}
    </div>
  );
}
