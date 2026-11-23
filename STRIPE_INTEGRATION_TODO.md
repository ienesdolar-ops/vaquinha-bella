# Stripe Integration TODO

## Values to Replace

The following values are placeholders and must be updated before going live.

**Files containing placeholders:**
- [.env.example](.env.example) → copie para `.env`
- [server.js](server.js)

| Field | Current Value | What to Set |
|-------|--------------|-------------|
| STRIPE_PUBLISHABLE_KEY | pk_test_... | Chave publicável em https://dashboard.stripe.com/test/apikeys (depois a `pk_live_...`) |
| STRIPE_SECRET_KEY | sk_test_... | Chave secreta, na mesma página. Nunca coloque no código nem no GitHub. |
| DOMAIN | http://localhost:4242 | Endereço real do site em produção (ex.: https://bella-to-england.onrender.com) |
| mode | payment | Mantenha "payment": a doação é um pagamento único. |
| line_items | `price_data` em USD com o valor que o doador escolhe | Já é um valor real e não precisa de Price ID. Se preferir um produto do Dashboard, troque por `{ price: "price_...", quantity: 1 }`. |

## Configured Parameters

These parameters were configured in Checkout Studio and are already set correctly.

**Files containing these parameters:**
- [server.js](server.js)
- [js/app.js](public/js/app.js) (appearance)

| Parameter | Value |
|-----------|-------|
| ui_mode | form |
| billing_address_collection | auto |
| phone_number_collection | { enabled: false } |
| automatic_tax | { enabled: false } (desligado a pedido: doações não têm imposto) |
| submit_type | donate |
| saved_payment_method_options | { payment_method_save: "enabled" } |
| integration_identifier | custom_embedded_web_0001 |
| payment_method_collection | omitido, porque só se aplica a `mode: "subscription"` |

## Setup

1. Instale o Node.js 18 ou superior (nodejs.org).
2. No terminal, dentro da pasta `vaquinha-bella`:
   ```
   npm install
   copy .env.example .env      (no Windows)
   ```
3. Preencha o `.env` com as chaves de teste.
4. Rode `npm start` e abra http://localhost:4242.

Dependências: `stripe` 23.x (API `2026-11-18.endive`, posterior à Dahlia), `express` e `dotenv`.

## Project structure (novos arquivos)

```
server.js                 servidor Express: site + /api/config + /api/create-checkout-session
package.json              dependências e "npm start"
.env.example              modelo das variáveis de ambiente
.gitignore                ignora .env e node_modules
STRIPE_INTEGRATION_TODO.md
```
Arquivos alterados: [index.html](public/index.html), que carrega o Stripe.js Dahlia e ganhou o container `#checkout-form`, e [js/app.js](public/js/app.js), com o formulário embutido.

## How it works

1. O doador escolhe o valor (US$) no modal e clica em **Pay by card**.
2. O navegador busca a chave publicável em `/api/config` e chama `POST /api/create-checkout-session` com `{ amount, lang }`.
3. O servidor valida o valor (de US$ 1 a 10.000), cria a Checkout Session com `ui_mode: "form"` e devolve `client_secret`.
4. O `stripe.initCheckoutFormSdk` monta o formulário dentro do modal, já no idioma do site.
5. Depois do pagamento, o Stripe volta para `/?donation=success`, e o site mostra "Thank you!".
6. Sem servidor (site aberto como arquivo ou hospedado só como estático), o botão abre o `stripeLink` do [js/config.js](public/js/config.js) como alternativa.

## Testing

Use as chaves `sk_test_` e `pk_test_`:

| Cartão | Resultado |
|--------|-----------|
| 4242 4242 4242 4242 | Pagamento aprovado |
| 4000 0025 0000 3155 | Pede autenticação 3D Secure |
| 4000 0000 0000 9995 | Recusado (saldo insuficiente) |

Use qualquer data futura, qualquer CVC e qualquer CEP.

## Next steps

- **Publicar:** o servidor precisa de hospedagem Node. O Netlify Drop não roda o `server.js`. Opções grátis ou baratas: Render.com (Web Service, comando `npm start`) ou Railway. Configure as variáveis do `.env` no painel da hospedagem.
- **Trocar para as chaves live** (`pk_live_` e `sk_live_`) depois de ativar a conta Stripe.
- **Atualizar o total arrecadado:** some as doações vistas em https://dashboard.stripe.com/payments e lance o total no `public/admin.html`. Se quiser automatizar, dá para adicionar um webhook `checkout.session.completed` que atualiza o Firebase sozinho.

## Resources

- https://support.stripe.com
- https://docs.stripe.com/mcp
