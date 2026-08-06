"use client";

import { useActionState } from "react";
import { login } from "@/app/admin/login/actions";

const initialState = { error: "" };

export function LoginForm({ nextPath }: { nextPath: string }) {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="admin-login-form">
      <input name="next" type="hidden" value={nextPath} />

      <label htmlFor="admin-email">Email quản trị</label>
      <input
        autoComplete="email"
        id="admin-email"
        name="email"
        placeholder="admin@tenmien.com"
        required
        type="email"
      />

      <label htmlFor="admin-password">Mật khẩu</label>
      <input
        autoComplete="current-password"
        id="admin-password"
        minLength={6}
        name="password"
        placeholder="Nhập mật khẩu"
        required
        type="password"
      />

      {state.error ? (
        <p aria-live="polite" className="admin-login-error">
          {state.error}
        </p>
      ) : null}

      <button className="primary-button full-button" disabled={pending} type="submit">
        {pending ? "Đang đăng nhập…" : "Đăng nhập"}
      </button>
    </form>
  );
}
