import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import { Resend } from "npm:resend";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
if (!RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY is missing");
}
const resend = new Resend(RESEND_API_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const BRAND_NAME = "Kalmat Fragrance";
const FROM_EMAIL = "orders@kalmatfragrance.store";
const TRACK_URL_BASE = "https://www.kalmatfragrance.store/track-order";

// Statuses that should NOT trigger a customer email
const SKIP_EMAIL_STATUSES = new Set(["pending", "pending_verification"]);

interface StatusContent {
  subject: string;
  heading: string;
  message: string;
  accent: string; // hex color for this status
}

const STATUS_CONTENT: Record<string, StatusContent> = {
  confirmed: {
    subject: "Your order has been confirmed",
    heading: "Order Confirmed",
    message:
      "Great news! Your order has been confirmed and our team is getting it ready.",
    accent: "#0ea5e9",
  },
  processing: {
    subject: "Your order is being processed",
    heading: "Order Processing",
    message:
      "Your fragrances are now being carefully prepared for packing.",
    accent: "#8b5cf6",
  },
  packed: {
    subject: "Your order has been packed",
    heading: "Order Packed",
    message:
      "Your order has been packed with care and is ready to be handed over for delivery.",
    accent: "#6366f1",
  },
  out_for_delivery: {
    subject: "Your order is out for delivery",
    heading: "Out for Delivery",
    message:
      "Your order is on its way! Please keep your phone reachable for the courier.",
    accent: "#f97316",
  },
  delivered: {
    subject: "Your order has been delivered",
    heading: "Order Delivered",
    message:
      "Your order has been delivered. We hope you love your new fragrance! Thank you for choosing us.",
    accent: "#10b981",
  },
  cancelled: {
    subject: "Your order has been cancelled",
    heading: "Order Cancelled",
    message:
      "Your order has been cancelled. If you did not request this or have any questions, please contact us.",
    accent: "#f43f5e",
  },
  declined: {
    subject: "Your order has been declined",
    heading: "Order Declined",
    message:
      "Unfortunately your order has been declined. Please contact us if you'd like more information or wish to place a new order.",
    accent: "#ef4444",
  },
  refund: {
    subject: "Your order has been refunded",
    heading: "Order Refunded",
    message:
      "A refund has been issued for your order. It may take a few business days to reflect, depending on your payment method.",
    accent: "#6b7280",
  },
};

interface RequestBody {
  order_id: string;
  new_status: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { order_id, new_status } = (await req.json()) as RequestBody;

    if (!order_id || !new_status) {
      return new Response(
        JSON.stringify({ error: "order_id and new_status are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (SKIP_EMAIL_STATUSES.has(new_status)) {
      return new Response(
        JSON.stringify({ success: true, email_sent: false, reason: "status does not require an email" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const content = STATUS_CONTENT[new_status];
    if (!content) {
      return new Response(
        JSON.stringify({ error: `Unknown status: ${new_status}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: "Order not found", detail: orderError?.message }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const html = buildStatusEmailHtml(order, content);

    let emailSent = false;
    let emailError: string | null = null;

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: order.email,
        subject: `${content.subject} - Order #${order.order_number}`,
        html,
      });
      emailSent = true;
    } catch (err) {
      emailError = err instanceof Error ? err.message : String(err);
      console.error("RESEND_ERROR:", emailError);
    }

    return new Response(
      JSON.stringify({ success: true, email_sent: emailSent, email_error: emailError }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("FUNCTION ERROR:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

// deno-lint-ignore no-explicit-any
function buildStatusEmailHtml(order: any, content: StatusContent): string {
  const trackUrl = `${TRACK_URL_BASE}?order=${encodeURIComponent(order.order_number)}&email=${encodeURIComponent(order.email)}`;

  const itemsRows = (order.items || [])
    .map(
      (i: { name: string; volume_ml: number; variant_label?: string; quantity: number; price: number }) =>
        `<tr><td style="padding:10px 0;border-bottom:1px solid #eee">${i.name} <span style="color:#999;font-size:11px">(${i.variant_label || `${i.volume_ml}ml`})</span></td><td style="padding:10px 0;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td><td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right">Rs ${(i.price * i.quantity).toLocaleString("en-PK")}</td></tr>`,
    )
    .join("");

  return `
  <div style="background:#0F0F0F;padding:20px">
    <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden">
      <div style="background:#0F0F0F;color:#C9A227;padding:30px;text-align:center">
        <h1 style="margin:0;font-size:26px;font-family:Georgia,serif">${BRAND_NAME}</h1>
        <p style="margin:6px 0 0;color:#999;font-size:12px;letter-spacing:2px">THE ART OF LUXURY PERFUMERY</p>
      </div>
      <div style="padding:32px">
        <span style="display:inline-block;padding:6px 14px;border-radius:20px;background:${content.accent}22;color:${content.accent};font-size:12px;font-weight:bold;letter-spacing:0.5px">${content.heading.toUpperCase()}</span>
        <h2 style="color:#0F0F0F;font-family:Georgia,serif;font-size:21px;margin:16px 0 4px">Hi ${order.customer_name},</h2>
        <p style="color:#666;font-size:15px;margin:0 0 24px">${content.message}</p>

        <div style="background:#f9f9f9;padding:16px;border-radius:6px;margin-bottom:24px">
          <p style="margin:0 0 6px;font-size:13px;color:#999">Order Number</p>
          <p style="margin:0;font-size:18px;font-weight:bold;color:#0F0F0F">${order.order_number}</p>
          <div style="text-align:center;margin-top:20px">
            <a href="${trackUrl}" style="display:inline-block;background:#C9A227;color:#0F0F0F;text-decoration:none;padding:14px 28px;border-radius:6px;font-size:14px;font-weight:bold;letter-spacing:1px;">
              TRACK YOUR ORDER
            </a>
          </div>
        </div>

        <h3 style="color:#0F0F0F;font-family:Georgia,serif;font-size:16px;margin:0 0 12px">Order Summary</h3>
        <table style="width:100%;font-size:14px;color:#333;border-collapse:collapse">
          <tr style="background:#f5f5f5">
            <th style="padding:10px;text-align:left">Item</th>
            <th style="padding:10px;text-align:center">Qty</th>
            <th style="padding:10px;text-align:right">Total</th>
          </tr>
          ${itemsRows}
        </table>

        <div style="margin-top:12px;padding-top:12px;border-top:2px solid #C9A227;font-size:18px;font-weight:bold;color:#0F0F0F;display:flex;justify-content:space-between">
          <span>Grand Total</span><span>Rs ${Number(order.total).toLocaleString("en-PK")}</span>
        </div>

        <p style="margin-top:28px;color:#999;font-size:12px;text-align:center">
          Questions about your order? Just reply to this email or contact ${BRAND_NAME}.<br>
        </p>
      </div>
    </div>
  </div>`;
}
