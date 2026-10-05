```markdown
# 🍔 Xica Gastronomia

Aplicação web em Angular para um food truck premium, com cardápio digital, carrinho de compras, autenticação de administração e integração direta com WhatsApp para fechamento de pedidos.

---

## 🚀 Visão Geral

A plataforma oferece:

- cardápio interativo com catálogo dinâmico
- carrinho persistente em localStorage
- checkout via WhatsApp com resumo do pedido
- painel administrativo com login seguro
- gestão de produtos, imagens e fila de pedidos
- armazenamento centralizado no Firebase
- upload de imagens para ImgBB

A arquitetura atual foi reorganizada para separar responsabilidades em serviços, mantendo a interface do usuário focada na experiência de compra e administração.

---

## 🛠️ Stack

- Angular 22
- Standalone Components
- TypeScript
- Firebase Auth + Firestore
- SCSS
- RxJS

---

## 📁 Estrutura Principal

```text
xica/
├── src/
│   ├── app/
│   │   ├── app.ts
│   │   ├── app.html
│   │   ├── app.scss
│   │   ├── app.config.ts
│   │   ├── app.spec.ts
│   │   ├── cart.service.ts
│   │   ├── cart.service.spec.ts
│   │   ├── xica-auth.service.ts
│   │   ├── xica-auth.service.spec.ts
│   │   ├── xica-data.service.ts
│   │   ├── xica-data.service.spec.ts
│   │   ├── xica-order.service.ts
│   │   └── xica-order.service.spec.ts
│   └── environments/
│       └── environment.ts
├── package.json
├── angular.json
├── tsconfig.json
├── README.md
└── public/
```

---

## 🔐 Configuração de Ambiente

As credenciais do Firebase e da API ImgBB devem ser mantidas em `src/environments/environment.ts`.

Exemplo de estrutura:

```ts
export const environment = {
  production: false,
  firebaseConfig: {
    apiKey: '...',
    authDomain: '...',
    projectId: '...',
    storageBucket: '...',
    messagingSenderId: '...',
    appId: '...',
    measurementId: '...'
  },
  imgbbApiKey: '...'
};
```

Essas configurações são injetadas em `app.config.ts` para inicializar Firebase e serviços de autenticação/firestore.

---

## ▶️ Como Executar

Pré-requisitos:

- Node.js 18+ 
- npm

Instale as dependências:

```bash
npm install
```

Inicie a aplicação:

```bash
npm start
```

Ou diretamente:

```bash
npx ng serve
```

A aplicação fica disponível em:

```text
http://localhost:4200
```

---

## 🧪 Testes

A suíte inclui testes unitários para o componente principal e para os serviços de domínio.

Para rodar os testes:

```bash
npx ng test --watch=false --browsers=chromium
```

Para gerar cobertura:

```bash
npx ng test --watch=false --browsers=chromium --code-coverage
```

---

## 🧩 Fluxo de Negócio

### Cliente

- visualiza o cardápio
- adiciona e remove itens do carrinho
- recebe aviso de cookies
- finaliza pedido via WhatsApp

### Administração

- acessa painel oculto no rodapé
- realiza login com Firebase Auth
- adiciona, edita e remove produtos
- visualiza pedidos em fila
- atualiza status dos pedidos

---

## 📝 Observações de Manutenção

A lógica da aplicação foi separada em serviços para facilitar manutenção e testes:

- `CartService`: manipulação do carrinho e persistência
- `XicaAuthService`: autenticação e recuperação de senha
- `XicaDataService`: leitura/escrita do cardápio e upload de imagens
- `XicaOrderService`: geração de pedidos, fila e atualização de status

---

## 👨‍💻 Autor

Desenvolvido por **Marcos André Díaz Farias**.


```