"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { OrderStatus } from "@/lib/orders";

const statusLabel: Record<OrderStatus, string> = {
  pending: "Awaiting payment",
  paid: "Paid",
  cancelled: "Cancelled",
  expired: "Expired",
  refunded: "Refunded",
};

export function PaymentStatus({ orderCode, initialStatus }: { orderCode: string; initialStatus: OrderStatus }) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);

  useEffect(() => {
    if (status !== "pending") return;

    const check = async () => {
      try {
        const response = await fetch(`/api/orders/${encodeURIComponent(orderCode)}`, {
          cache: "no-store",
        });
        if (!response.ok) return;
        const data = (await response.json()) as { status?: OrderStatus };
        if (!data.status) return;
        setStatus(data.status);
        if (data.status === "paid") {
          router.replace(`/payment/success?order=${encodeURIComponent(orderCode)}`);
          router.refresh();
        }
      } catch {
        // Temporary network loss: the next polling cycle will retry.
      }
    };

    const timer = window.setInterval(() => void check(), 3000);
    void check();
    return () => window.clearInterval(timer);
  }, [orderCode, router, status]);

  return <span className={`waiting-dot payment-status-${status}`}>{statusLabel[status]}</span>;
}
