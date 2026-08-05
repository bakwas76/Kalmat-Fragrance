import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import { Resend } from "npm:resend";
const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const ADMIN_EMAIL = "idpes5504@gmail.com";
const BRAND_NAME = "Kalmat Fragrance";

const PAYMENT_LABELS: Record<string, string> = {
  cod: "Cash on Delivery",
  manual: "Manual Payment",
};

// Gmail SMTP credentials from environment variables
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// WhatsApp Business API credentials (Meta Cloud API)
const ADMIN_WHATSAPP_NUMBER = "923219247773"; // 03219247773 in international format
const WHATSAPP_TOKEN = Deno.env.get("WHATSAPP_ADMIN_TOKEN") || "";
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID") || "";

interface OrderItemInput {
  product_id: string;
  name: string;
  slug: string;
  price: number;
  quantity: number;
  bottle_shape: string;
  bottle_glass: string;
  bottle_cap: string;
  bottle_label: string;
  volume_ml: number;
  image_url?: string | null;
  variant_id?: string | null;
  variant_label?: string | null;
}

interface PlaceOrderBody {
  order_number: string;
  user_id?: string | null;
  customer_name: string;
  email: string;
  phone: string;
  billing_address: object;
  shipping_address: object;
  items: OrderItemInput[];
  subtotal: number;
  discount: number;
  shipping_cost: number;
  tax: number;
  total: number;
  payment_method: "cod" | "manual";
  payment_receipt_url?: string | null;
  coupon_code?: string | null;
  notes?: string | null;
  pdf_base64?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as PlaceOrderBody;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // ---- 1. Insert the order ----
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: body.order_number,
        user_id: body.user_id ?? null,
        customer_name: body.customer_name,
        email: body.email,
        phone: body.phone,
        billing_address: body.billing_address,
        shipping_address: body.shipping_address,
        items: body.items,
        subtotal: body.subtotal,
        discount: body.discount,
        shipping_cost: body.shipping_cost,
        tax: body.tax,
        total: body.total,
        payment_method: body.payment_method,
        payment_status: body.payment_method === "cod" ? "pending" : "pending_verification",
        payment_receipt_url: body.payment_receipt_url ?? null,
        order_status: "confirmed",
        coupon_code: body.coupon_code ?? null,
        notes: body.notes ?? null,
      })
      .select()
      .single();

    if (orderError) {
      return new Response(
        JSON.stringify({ error: "Failed to create order", detail: orderError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Increment coupon usage
    if (body.coupon_code) {
      await supabase.rpc("increment_coupon_usage", { code_input: body.coupon_code }).then(() => {});
    }

    // ---- 2. Build WhatsApp message ----
    const itemList = body.items
      .map((i) => `• ${i.name} (${i.variant_label || `${i.volume_ml}ml`}) x${i.quantity} — Rs ${(i.price * i.quantity).toLocaleString('en-PK')}`)
      .join("\n");

    const whatsappText =
      `*${BRAND_NAME} — New Order*\n\n` +
      `Order ID: ${body.order_number}\n` +
      `Customer: ${body.customer_name}\n` +
      `Phone: ${body.phone}\n` +
      `Email: ${body.email}\n\n` +
      `*Items:*\n${itemList}\n\n` +
      `Subtotal: Rs ${body.subtotal.toLocaleString('en-PK')}\n` +
      (body.discount > 0 ? `Discount: -Rs ${body.discount.toLocaleString('en-PK')}\n` : "") +
      `Shipping: Rs ${body.shipping_cost.toLocaleString('en-PK')}\n` +
      `*Total: Rs ${body.total.toLocaleString('en-PK')}*\n\n` +
      `Payment: ${body.payment_method === "cod" ? "Cash on Delivery" : PAYMENT_LABELS[body.payment_method] || body.payment_method}${body.payment_receipt_url ? " (Receipt attached)" : ""}\n\n` +
      `Shipping Address:\n${(body.shipping_address as { address_line?: string }).address_line || ""}, ${(body.shipping_address as { city?: string }).city || ""}`;

    // ---- 3. Send emails using Resend ----
let ownerEmailSent = false;
let customerEmailSent = false;
let emailError: string | null = null;

try {
  if (body.pdf_base64) {

    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: "idpes5504@gmail.com",
      subject: `New Order Received - Order #${body.order_number}`,
      html: buildOwnerEmailHtml(body),
      attachments: [
        {
          filename: `invoice-${body.order_number}.pdf`,
          content: body.pdf_base64,
        },
      ],
    });

    ownerEmailSent = true;

    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: body.email ,
      subject: `Order Confirmation - Order #${body.order_number}`,
      html: buildCustomerEmailHtml(body),
      attachments: [
        {
          filename: `invoice-${body.order_number}.pdf`,
          content: body.pdf_base64,
        },
      ],
    });

    customerEmailSent = true;
  }
} catch (err) {
  emailError = err instanceof Error ? err.message : String(err);
  console.error("RESEND_ERROR:", emailError);
}

        const pdfBuffer = Buffer.from(body.pdf_base64, "base64");
        const attachment = {
          filename: `invoice-${body.order_number}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        };

        // --- Email 1: To store owner ---
        try {
          await transporter.sendMail({
            from: `${BRAND_NAME} <${GMAIL_USER}>`,
            to: ADMIN_EMAIL,
            subject: `New Order Received - Order #${body.order_number}`,
            html: buildOwnerEmailHtml(body),
            attachments: [attachment],
          });
          ownerEmailSent = true;
          console.log("OWNER_EMAIL_SENT", { to: ADMIN_EMAIL, order: body.order_number });
        } catch (err) {
          console.error("OWNER_EMAIL_ERROR", err instanceof Error ? err.message : String(err));
        }

        // --- Email 2: To customer ---
        try {
          await transporter.sendMail({
            from: `${BRAND_NAME} <${GMAIL_USER}>`,
            to: body.email,
            subject: `Order Confirmation - Order #${body.order_number}`,
            html: buildCustomerEmailHtml(body),
            attachments: [attachment],
          });
          customerEmailSent = true;
          console.log("CUSTOMER_EMAIL_SENT", { to: body.email, order: body.order_number });
        } catch (err) {
          console.error("CUSTOMER_EMAIL_ERROR", err instanceof Error ? err.message : String(err));
        }
      } catch (err) {
        emailError = err instanceof Error ? err.message : String(err);
        console.error("SMTP_SETUP_ERROR", emailError);
      }
    } else {
      const missing: string[] = [];
      if (!GMAIL_USER) missing.push("GMAIL_USER");
      if (!GMAIL_APP_PASSWORD) missing.push("GMAIL_APP_PASSWORD");
      if (!body.pdf_base64) missing.push("pdf_base64");
      emailError = `Missing: ${missing.join(", ")}`;
      console.log("EMAIL_SKIPPED", { missing });
    }

    // ---- 4. Send WhatsApp Business API notification to admin ----
    let whatsappAdminSent = false;
    let whatsappAdminError: string | null = null;

    if (WHATSAPP_TOKEN && WHATSAPP_PHONE_NUMBER_ID) {
      try {
        const orderTime = new Date().toLocaleString("en-PK", { timeZone: "Asia/Karachi" });
        const adminMessage =
          "📦 New Order Received\n\n" +
          `Order ID: ${body.order_number}\n` +
          `Customer Name: ${body.customer_name}\n` +
          `Phone: ${body.phone}\n` +
          `Email: ${body.email}\n` +
          `Address: ${(body.shipping_address as { address_line?: string }).address_line || ""}\n` +
          `City: ${(body.shipping_address as { city?: string }).city || ""}\n` +
          `Payment Method: ${PAYMENT_LABELS[body.payment_method] || body.payment_method}\n` +
          `Order Total: Rs ${body.total.toLocaleString("en-PK")}\n` +
          "Products:\n" +
          body.items.map((i) => `- ${i.name} (${i.variant_label || `${i.volume_ml}ml`}) × ${i.quantity}`).join("\n") +
          `\nOrder Time: ${orderTime}`;

        const waRes = await fetch(
          `https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${WHATSAPP_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              to: ADMIN_WHATSAPP_NUMBER,
              type: "text",
              text: { body: adminMessage },
            }),
          },
        );

        if (!waRes.ok) {
          const waErr = await waRes.text();
          whatsappAdminError = `WhatsApp API error (${waRes.status}): ${waErr}`;
          console.error("WHATSAPP_ADMIN_ERROR", whatsappAdminError);
        } else {
          whatsappAdminSent = true;
          console.log("WHATSAPP_ADMIN_SENT", { to: ADMIN_WHATSAPP_NUMBER, order: body.order_number });
        }
      } catch (err) {
        whatsappAdminError = err instanceof Error ? err.message : String(err);
        console.error("WHATSAPP_ADMIN_ERROR", whatsappAdminError);
      }
    } else {
      const missing: string[] = [];
      if (!WHATSAPP_TOKEN) missing.push("WHATSAPP_ADMIN_TOKEN");
      if (!WHATSAPP_PHONE_NUMBER_ID) missing.push("WHATSAPP_PHONE_NUMBER_ID");
      whatsappAdminError = `Missing: ${missing.join(", ")}`;
      console.log("WHATSAPP_ADMIN_SKIPPED", { missing });
    }

    return new Response(
      JSON.stringify({
        success: true,
        order,
        whatsapp_text: whatsappText,
        whatsapp_url: `https://wa.me/?text=${encodeURIComponent(whatsappText)}`,
        owner_email_sent: ownerEmailSent,
        customer_email_sent: customerEmailSent,
        email_error: emailError,
        whatsapp_admin_sent: whatsappAdminSent,
        whatsapp_admin_error: whatsappAdminError,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
  const message = err instanceof Error ? err.message : String(err);

  console.error("FUNCTION ERROR:", message);

  return new Response(
    JSON.stringify({ error: message }),
    {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    }
  );
}
});
      

// ---- Email HTML templates ----

function buildOwnerEmailHtml(body: PlaceOrderBody): string {
  const itemsRows = body.items
    .map(
      (i) =>
        `<tr><td style="padding:10px 0;border-bottom:1px solid #eee">${i.name} (${i.volume_ml}ml)</td><td style="padding:10px 0;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td><td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right">Rs ${(i.price * i.quantity).toLocaleString('en-PK')}</td></tr>`,
    )
    .join("");

  return `
  <div style="background:#0F0F0F;padding:20px">
    <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden">
      <div style="background:#0F0F0F;color:#C9A227;padding:24px;text-align:center">
        <h1 style="margin:0;font-size:24px;font-family:Georgia,serif">${BRAND_NAME}</h1>
        <p style="margin:4px 0 0;color:#999;font-size:12px">New Order Received</p>
      </div>
      <div style="padding:24px">
        <h2 style="color:#333;font-family:Georgia,serif">Order #${body.order_number}</h2>
        <p style="color:#666;font-size:14px;margin-bottom:20px">
          A new order has been placed. The PDF invoice is attached for printing.
        </p>
        <table style="width:100%;font-size:13px;color:#333;border-collapse:collapse">
          <tr style="background:#f5f5f5">
            <th style="padding:10px;text-align:left">Item</th>
            <th style="padding:10px;text-align:center">Qty</th>
            <th style="padding:10px;text-align:right">Total</th>
          </tr>
          ${itemsRows}
        </table>
        <div style="margin-top:16px;padding-top:16px;border-top:2px solid #C9A227;font-size:18px;font-weight:bold;color:#0F0F0F;text-align:right">
          Grand Total: Rs ${body.total.toLocaleString('en-PK')}
        </div>
        <div style="margin-top:24px;padding:16px;background:#f9f9f9;border-radius:4px">
          <p style="margin:0 0 8px;font-weight:bold;color:#333">Customer Details:</p>
          <p style="margin:0;color:#666;font-size:13px"><strong>Name:</strong> ${body.customer_name}</p>
          <p style="margin:0;color:#666;font-size:13px"><strong>Email:</strong> ${body.email}</p>
          <p style="margin:0;color:#666;font-size:13px"><strong>Phone:</strong> ${body.phone}</p>
          <p style="margin:8px 0 0;color:#666;font-size:13px"><strong>Address:</strong> ${(body.shipping_address as { address_line?: string }).address_line}, ${(body.shipping_address as { city?: string }).city}</p>
          <p style="margin:4px 0 0;color:#666;font-size:13px"><strong>Payment:</strong> ${PAYMENT_LABELS[body.payment_method] || body.payment_method}${body.payment_receipt_url ? " (Receipt attached)" : ""}</p>
        </div>
        <p style="margin-top:24px;color:#999;font-size:11px;text-align:center">
          Print the attached PDF invoice for your records.
        </p>
      </div>
    </div>
  </div>`;
}

function buildCustomerEmailHtml(body: PlaceOrderBody): string {
  const itemsRows = body.items
    .map(
      (i) =>
        `<tr><td style="padding:12px 0;border-bottom:1px solid #eee">${i.name} <span style="color:#999;font-size:11px">(${i.volume_ml}ml)</span></td><td style="padding:12px 0;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td><td style="padding:12px 0;border-bottom:1px solid #eee;text-align:right">Rs ${(i.price * i.quantity).toLocaleString('en-PK')}</td></tr>`,
    )
    .join("");

  const estimatedDelivery = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toLocaleDateString('en-PK', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
  <div style="background:#0F0F0F;padding:20px">
    <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden">
      <div style="background:#0F0F0F;color:#C9A227;padding:30px;text-align:center">
        <h1 style="margin:0;font-size:28px;font-family:Georgia,serif">${BRAND_NAME}</h1>
        <p style="margin:6px 0 0;color:#999;font-size:13px;letter-spacing:2px">THE ART OF LUXURY PERFUMERY</p>
      </div>
      <div style="padding:32px">
        <h2 style="color:#0F0F0F;font-family:Georgia,serif;font-size:22px;margin:0 0 4px">Shukriya, ${body.customer_name}!</h2>
        <p style="color:#666;font-size:15px;margin:0 0 24px">
          Thank you for your order. We are delighted to prepare your fragrances with the utmost care.
        </p>

        <div style="background:#f9f9f9;padding:16px;border-radius:6px;margin-bottom:24px">
          <p style="margin:0 0 6px;font-size:13px;color:#999">Order Number</p>
          <p style="margin:0 0 12px;font-size:18px;font-weight:bold;color:#0F0F0F">${body.order_number}</p>
          <p style="margin:0 0 6px;font-size:13px;color:#999">Estimated Delivery</p>
          <p style="margin:0;font-size:14px;color:#0F0F0F">${estimatedDelivery}</p>
          <p style="margin:6px 0 0;font-size:12px;color:#999">Delivery within 3-5 business days in Pakistan</p>
        </div>

        <h3 style="color:#0F0F0F;font-family:Georgia,serif;font-size:18px;margin:0 0 12px">Order Summary</h3>
        <table style="width:100%;font-size:14px;color:#333;border-collapse:collapse">
          <tr style="background:#f5f5f5">
            <th style="padding:10px;text-align:left">Item</th>
            <th style="padding:10px;text-align:center">Qty</th>
            <th style="padding:10px;text-align:right">Total</th>
          </tr>
          ${itemsRows}
        </table>

        <div style="margin-top:16px;font-size:14px;color:#666">
          <div style="display:flex;justify-content:space-between;padding:4px 0">
            <span>Subtotal</span><span>Rs ${body.subtotal.toLocaleString('en-PK')}</span>
          </div>
          ${body.discount > 0 ? `<div style="display:flex;justify-content:space-between;padding:4px 0;color:#2e7d32"><span>Discount</span><span>-Rs ${body.discount.toLocaleString('en-PK')}</span></div>` : ""}
          <div style="display:flex;justify-content:space-between;padding:4px 0">
            <span>Shipping</span><span>${body.shipping_cost === 0 ? "Free" : `Rs ${body.shipping_cost.toLocaleString('en-PK')}`}</span>
          </div>
        </div>
        <div style="margin-top:12px;padding-top:12px;border-top:2px solid #C9A227;font-size:20px;font-weight:bold;color:#0F0F0F;display:flex;justify-content:space-between">
          <span>Grand Total</span><span>Rs ${body.total.toLocaleString('en-PK')}</span>
        </div>

        <div style="margin-top:24px;padding:16px;background:#f9f9f9;border-radius:6px">
          <p style="margin:0 0 6px;font-weight:bold;color:#333;font-size:13px">Delivery Address:</p>
          <p style="margin:0;color:#666;font-size:13px">${body.customer_name}</p>
          <p style="margin:0;color:#666;font-size:13px">${(body.shipping_address as { address_line?: string }).address_line}</p>
          <p style="margin:0;color:#666;font-size:13px">${(body.shipping_address as { city?: string }).city}, ${(body.shipping_address as { postal_code?: string }).postal_code || ""}</p>
          <p style="margin:0;color:#666;font-size:13px">${body.phone}</p>
        </div>

        <div style="margin-top:24px;padding:20px;background:#0F0F0F;color:#C9A227;border-radius:6px;text-align:center">
          <p style="margin:0;font-size:14px">Your PDF invoice is attached to this email.</p>
          <p style="margin:6px 0 0;font-size:12px;color:#999">Keep it for your records or track your order on our website.</p>
        </div>

        <p style="margin-top:24px;color:#999;font-size:12px;text-align:center">
          If you have any questions, contact us at ${BRAND_NAME}<br>
          This is an automated email — please do not reply.
        </p>
      </div>
    </div>
  </div>`;
}
