"use client";

import { useActionState } from "react";
import { login } from "@/app/admin/login/actions";

const initialState = { error: "" };

export function LoginForm({ nextPath }: { nextPath: string }) {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="admin-login-form">
      <input name="next" type="hidden" value={nextPath} />

      <label htmlFor="admin-email">Admin email</label>
      <input
        autoComplete="email"
        id="admin-email"
        name="email"
        placeholder="admin@example.com"
        required
        type="email"
      />

      <label htmlFor="admin-password">Password</label>
      <input
        autoComplete="current-password"
        id="admin-password"
        minLength={6}
        name="password"
        placeholder="Enter your password"
        required
        type="password"
      />

      {state.error ? (
        <p aria-live="polite" className="admin-login-error">
          {state.error}
        </p>
      ) : null}

      <button className="primary-button full-button" disabled={pending} type="submit">
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
