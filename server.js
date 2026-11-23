require("dotenv").config();
const path = require("path");
const express = require("express");
const Stripe = require("stripe");

// SDK 23.x usa a API 2026-11-18.endive (posterior à Dahlia, compatível com ui_mode "form")
// Se a chave não estiver configurada, o site abre normalmente e só o pagamento por cartão avisa o erro
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const app = express();

// Arquivos do site ficam em public/ (na Vercel, essa pasta é servida direto pelo CDN)
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// Chave publicável para o navegador
app.get("/api/config", (req, res) => {
  res.json({ publishableKey: process.env.STRIPE_PUBLISHABLE_KEY });
});

const LOCALES = { pt: "pt-BR", en: "en-GB", es: "es", fr: "fr", it: "it", ar: "auto", zh: "zh", ja: "ja" };

app.post("/api/create-checkout-session", async (req, res) => {
  if (!stripe) return res.status(503).json({ error: "STRIPE_SECRET_KEY not configured" });
  try {
    // Doação livre em dólar: mínimo US$ 1, máximo US$ 10.000
    const usd = Math.round(Number(req.body?.amount) || 0);
    if (usd < 1 || usd > 10000) return res.status(400).json({ error: "Invalid amount" });

    const session = await stripe.checkout.sessions.create({
      ui_mode: "form",
      mode: "payment",
      submit_type: "donate",
      billing_address_collection: "auto",
      phone_number_collection: { enabled: false },
      automatic_tax: { enabled: false },
      saved_payment_method_options: { payment_method_save: "enabled" },
      integration_identifier: "custom_embedded_web_0001",
      locale: LOCALES[req.body?.lang] || "auto",
      line_items: [{
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: usd * 100,
          product_data: { name: "Donation for Bella's trip to England 🇬🇧" },
        },
      }],
      return_url: `${process.env.DOMAIN}/?donation=success&session_id={CHECKOUT_SESSION_ID}`,
    });

    res.json({ client_secret: session.client_secret });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

const port = process.env.PORT || 4242;
app.listen(port, () => console.log(`Vaquinha rodando em http://localhost:${port}`));
module.exports = app;
