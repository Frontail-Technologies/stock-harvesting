declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open(): void };
  }
}

let loader: Promise<void> | null = null;

function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve();
  if (loader) return loader;
  loader = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Unable to load Razorpay Checkout"));
    document.head.appendChild(script);
  });
  return loader;
}

export async function openRazorpaySubscription(input: { keyId: string; subscriptionId: string; name: string; email?: string; onSuccess: () => void }) {
  await loadRazorpay();
  if (!window.Razorpay) throw new Error("Razorpay Checkout is unavailable");
  const checkout = new window.Razorpay({
    key: input.keyId,
    subscription_id: input.subscriptionId,
    name: "Stock Harvesting",
    description: input.name,
    prefill: { email: input.email },
    theme: { color: "#eab308" },
    handler: input.onSuccess,
  });
  checkout.open();
}
