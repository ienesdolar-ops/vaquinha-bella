# Vaquinha da Bella: como colocar no ar

Todas as configurações ficam em `js/config.js`.

## 1. Foto
Salve a foto da Bella como `img/bella.jpg`. Enquanto não houver foto, aparece um "B" dourado.

## 2. Cartão internacional (Stripe)
1. Crie uma conta em stripe.com (aceita conta bancária no Brasil).
2. Vá em **Payment Links → Novo**, crie o produto "Doação para a Bella" e marque **"Permitir que o cliente escolha o valor"**, com a moeda em USD.
3. Cole o link em `stripeLink`.

O Stripe aceita cartões de qualquer país, além de Apple Pay e Google Pay.

## 3. PayPal
Crie o seu paypal.me (paypal.com/paypalme) e coloque o usuário em `paypalUser`.

## 4. Pix
Preencha `pix.chave`, `pix.nome` e `pix.cidade`, sem acentos. O QR Code é gerado automaticamente.

## 5. Atualizar o valor arrecadado (opcional, recomendado)
Sem o Firebase, o site mostra o valor fixo de `arrecadadoBRL`, que você edita no arquivo. Para atualizar pelo `admin.html`:
1. Crie um projeto grátis em console.firebase.google.com e adicione um app **Web**.
2. Copie `apiKey`, `authDomain`, `projectId` e `appId` para `firebase` no `config.js`.
3. Em **Authentication**, ative "E-mail/senha" e crie o seu usuário.
4. Em **Firestore Database**, crie o banco e cole estas regras, trocando pelo seu e-mail:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    match /vaquinha/status {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.email == "SEU_EMAIL";
    }
  }
}
```
5. Abra `seusite/admin.html`, entre, informe o total em reais e salve.

## 6. Publicar grátis
Arraste a pasta `vaquinha-bella` para app.netlify.com/drop. Em segundos o site recebe um link público.
