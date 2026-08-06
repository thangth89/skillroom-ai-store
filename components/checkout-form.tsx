"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CheckoutForm({ slug }: { slug: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Vui lòng nhập đúng địa chỉ email nhận Skill.");
      return;
    }
    if (!agreed) {
      setError("Bạn cần đồng ý với điều khoản sản phẩm số.");
      return;
    }
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, slug }),
      });
      const data = (await response.json()) as { orderCode?: string; error?: string };
      if (!response.ok || !data.orderCode) {
        setError(data.error || "Không thể tạo đơn hàng. Vui lòng thử lại.");
        return;
      }
      router.push(`/payment/${encodeURIComponent(data.orderCode)}`);
    } catch {
      setError("Không thể kết nối máy chủ. Vui lòng kiểm tra mạng và thử lại.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="checkout-form" onSubmit={submit} noValidate>
      <label htmlFor="email">Email nhận Skill</label>
      <input
        id="email"
        name="email"
        type="email"
        value={email}
        onChange={(event) => { setEmail(event.target.value); setError(""); }}
        placeholder="ban@example.com"
        autoComplete="email"
      />
      <p className="field-help">Chúng tôi sẽ gửi liên kết tải có thời hạn đến địa chỉ này.</p>
      <label className="check-row">
        <input type="checkbox" checked={agreed} onChange={(event) => { setAgreed(event.target.checked); setError(""); }} />
        <span>Tôi đã kiểm tra email và đồng ý với điều khoản sử dụng Skill.</span>
      </label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="primary-button full-button" disabled={pending} type="submit">{pending ? "Đang tạo mã QR…" : "Tiếp tục thanh toán"} <span>→</span></button>
      <p className="secure-note">Thanh toán VietQR qua payOS • Tiền chuyển trực tiếp tới tài khoản của cửa hàng</p>
    </form>
  );
}
