const telemetryEndpoint = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8082"}/api/telemetry/errors`;

function report(payload: {
  type: string;
  path: string;
  source?: string;
  line?: number;
  column?: number;
}) {
  if (process.env.NEXT_PUBLIC_MONITORING_ENABLED === "false") return;
  try {
    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        telemetryEndpoint,
        new Blob([body], { type: "application/json" }),
      );
    } else {
      void fetch(telemetryEndpoint, {
        method: "POST",
        body,
        headers: { "Content-Type": "application/json" },
        keepalive: true,
      });
    }
  } catch {
    // La télémétrie ne doit jamais perturber l’application.
  }
}

window.addEventListener("error", (event) => {
  report({
    type: event.error?.name || "Error",
    path: window.location.pathname,
    source: event.filename || undefined,
    line: event.lineno || undefined,
    column: event.colno || undefined,
  });
});

window.addEventListener("unhandledrejection", (event) => {
  const type =
    event.reason instanceof Error ? event.reason.name : "UnhandledRejection";
  report({ type, path: window.location.pathname });
});
