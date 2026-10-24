"use client";

import { useFormStatus } from "react-dom";
import { ArrowUpRight } from "lucide-react";

export function LoginSubmit() {
  const { pending } = useFormStatus();
  return (
    <button
      className="button dark full"
      type="submit"
      disabled={pending}
      aria-live="polite"
    >
      {pending ? "Signing in…" : "Sign in"}
      {!pending && <ArrowUpRight size={18} />}
    </button>
  );
}
