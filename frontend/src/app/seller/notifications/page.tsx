"use client";
import { useEffect, useState } from "react";
import {
  fetchSellerNotifications,
  readSellerNotification,
  SellerNotification,
} from "@/lib/api";
export default function Page() {
  const [n, setN] = useState<SellerNotification[]>([]);
  const load = () => fetchSellerNotifications().then(setN);
  useEffect(() => {
    void load();
  }, []);
  return (
    <section>
      <h1 className="text-2xl font-black">Notifications</h1>
      <div className="mt-5 space-y-3">
        {n.map((x) => (
          <button
            key={x.id}
            onClick={async () => {
              if (!x.read) {
                await readSellerNotification(x.id);
                load();
              }
            }}
            className={`w-full rounded-xl border p-4 text-left ${x.read ? "bg-white" : "border-blue-200 bg-blue-50"}`}
          >
            <b>{x.title}</b>
            <p className="mt-1 text-sm text-slate-600">{x.message}</p>
          </button>
        ))}
        {!n.length && (
          <p className="rounded-xl border bg-white p-6 text-sm text-slate-500">
            Aucune notification.
          </p>
        )}
      </div>
    </section>
  );
}
