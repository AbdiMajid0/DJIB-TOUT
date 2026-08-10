"use client";

import { useReportWebVitals } from "next/web-vitals";

type WebVitalMetric = Parameters<typeof useReportWebVitals>[0] extends (
  metric: infer Metric,
) => void
  ? Metric
  : never;

const endpoint = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8082"}/api/telemetry/web-vitals`;

function reportMetric(metric: WebVitalMetric) {
  if (process.env.NEXT_PUBLIC_MONITORING_ENABLED === "false") return;
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
  });

  if (navigator.sendBeacon) {
    navigator.sendBeacon(endpoint, new Blob([body], { type: "application/json" }));
    return;
  }

  void fetch(endpoint, {
    method: "POST",
    body,
    headers: { "Content-Type": "application/json" },
    keepalive: true,
  });
}

export default function WebVitals() {
  useReportWebVitals(reportMetric);
  return null;
}
