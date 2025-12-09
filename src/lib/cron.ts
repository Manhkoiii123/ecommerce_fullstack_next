import cron from "node-cron";

function timeout(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function safeFetch(url: string, options: RequestInit = {}, retries = 3) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);

    const finalOptions: any = {
      method: options.method || "GET",
      headers: { ...(options.headers || {}) },
      signal: controller.signal,
    };

    if (options.body) {
      const rawBody =
        typeof options.body === "string"
          ? Buffer.from(options.body)
          : Buffer.from(JSON.stringify(options.body));

      finalOptions.body = rawBody;
      finalOptions.headers["Content-Length"] = String(rawBody.length);
      finalOptions.duplex = "half";
      finalOptions.headers["Connection"] = "close";

      if (!finalOptions.headers["Content-Type"]) {
        finalOptions.headers["Content-Type"] = "application/json";
      }
      if (!finalOptions.headers["Accept"]) {
        finalOptions.headers["Accept"] = "application/json";
      }
    }

    const res = await fetch(url, finalOptions);
    clearTimeout(timer);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res;
  } catch (err) {
    if (retries > 0) {
      await timeout(600);
      return safeFetch(url, options, retries - 1);
    }
    throw err;
  }
}

export async function runCron() {
  const cancelUrl = "http://localhost:3000/api/cron/auto-cancel-orders";

  const response = await safeFetch(cancelUrl, { method: "POST" });
  const data = await response.json();

  console.log("Auto cancel result:", data);
}

cron.schedule("01 18 * * *", () => {
  runCron().catch((e) => console.error("runCron error:", e));
});
