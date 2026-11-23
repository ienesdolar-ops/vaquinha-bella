// ======================================================
//  CONFIGURAÇÃO DA VAQUINHA — edite só este arquivo
// ======================================================
window.VAQUINHA = {
  nome: "Bella",
  cotacaoBRL: 5.45,            // 1 USD = R$ 5,45
  metaBRL: 30000,              // meta em reais (exibida em dólar)
  arrecadadoBRL: 20000,        // valor inicial (usado se o Firebase não estiver configurado)
  apoiadoresIniciais: 42,

  // Valores sugeridos (US$)
  valores: [10, 25, 50, 100],

  // Stripe Payment Link com "o cliente escolhe o valor" (cartões do mundo todo, Apple/Google Pay)
  stripeLink: "https://buy.stripe.com/SEU_LINK_AQUI",

  // PayPal: seu usuário do paypal.me (ex.: "bellainglaterra")
  paypalUser: "SEU_USUARIO_PAYPAL",

  // Pix (doadores do Brasil)
  pix: {
    chave: "sua-chave-pix@email.com",
    nome: "BELLA",       // até 25 caracteres, sem acento
    cidade: "SAO PAULO", // até 15 caracteres, sem acento
  },

  // Firebase (opcional, para atualizar o total pelo admin.html).
  // Deixe apiKey vazio para usar os valores fixos acima.
  firebase: {
    apiKey: "",
    authDomain: "",
    projectId: "",
    appId: "",
  },
};
