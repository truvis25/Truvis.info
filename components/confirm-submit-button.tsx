"use client";

import type { ReactNode } from "react";

// Submit button for destructive server-action forms: asks for confirmation
// before the form posts. Drop-in replacement for a plain <button type="submit">.
export function ConfirmSubmitButton({
  confirmMessage,
  className,
  children,
}: {
  confirmMessage: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(confirmMessage)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
