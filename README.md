```markdown
# 🍔 Xica's Gastronomia - Menu Digital & Pedidos

Uma aplicação web moderna, responsiva e focada na experiência do utilizador (UX) construída para digitalizar o atendimento de um Food Truck premium[cite: 13]. O sistema funciona como um cardápio digital interativo com gestão de carrinho local e integração direta para finalização de pedidos via WhatsApp[cite: 13].

---

## 🚀 Funcionalidades Principais

* **Design Premium (Dark Mode Exclusivo):** Interface desenvolvida inteiramente sem a utilização da cor branca, aplicando uma paleta de tons de café (`#1a1615`), vermelho bordô e dourado[cite: 13]. Elementos de *glassmorphism* (fundos translúcidos com desfoque) proporcionam um aspeto moderno[cite: 13].
* **Carrinho de Compras Adaptativo:** 
  * **Desktop:** Apresenta-se como uma barra lateral fixa (Side-bar) à direita, redimensionando automaticamente a grelha de produtos para evitar sobreposições[cite: 13].
  * **Mobile:** Transforma-se numa aba inferior nativa (Bottom-sheet) fixada à base do ecrã, maximizando a área de visualização e facilitando o uso com uma só mão[cite: 13].
* **Persistência de Dados (Local Storage):** O estado do carrinho é guardado no navegador do utilizador associado à data atual[cite: 13]. Se o cliente fechar a página e voltar no mesmo dia, o pedido continua lá[cite: 13]. No dia seguinte, o carrinho é limpo automaticamente[cite: 13].
* **Checkout via WhatsApp:** Ao finalizar, o sistema calcula os totais e formata uma mensagem de texto limpa e detalhada, redirecionando o utilizador diretamente para o WhatsApp do estabelecimento[cite: 13].
* **Aviso de Privacidade / Cookies:** Banner interativo integrado para consentimento de utilização de armazenamento local (cumprimento de boas práticas web)[cite: 13].
* **Gestão Dinâmica de Cardápio em Tempo Real (Firebase):** Sistema de administração integrado e oculto que permite adicionar, editar e excluir pratos dinamicamente, com os dados guardados em nuvem e sincronizados instantaneamente com a vitrine do cliente.
* **Upload Automático de Imagens (ImgBB):** Tratamento de imagens nativo na plataforma. Ao cadastrar um produto com fotografia, a imagem é enviada silenciosamente via API para um servidor em nuvem gratuito (ImgBB), substituindo o ícone vetorial padrão do restaurante pela foto real.
* **Autenticação Segura:** Área de gestão protegida por login (e-mail e palavra-passe) com Firebase Authentication, garantindo que apenas a equipa do restaurante tem acesso ao painel.

---

## 🛠️ Tecnologias Utilizadas

* **Framework Frontend:** Angular (v17+) com abordagem *Standalone Components* (sem `app.module.ts`)[cite: 13].
* **Backend as a Service:** Firebase (Firestore Database para dados em tempo real e Firebase Authentication para segurança).
* **Armazenamento de Média:** ImgBB API para alojamento otimizado de imagens.
* **Estilização:** SCSS (Sass) puro com variáveis CSS avançadas, *media queries* e animações *keyframes* customizadas[cite: 13].
* **Linguagem:** TypeScript e HTML5 semântico[cite: 13].
* **Integrações Externas:** API Fetch (nativa do JavaScript) e WhatsApp Web/App API (`wa.me`)[cite: 13].

---

## 📁 Estrutura de Ficheiros Relevantes

A arquitetura do projeto foi desenhada de forma modular e limpa. Os ficheiros principais são:

```text
xica/
├── public/
│   ├── logo.jpg             # Logomarca do estabelecimento
│   └── favicon.ico          # Ícone do navegador
├── src/
│   └── app/
│       ├── app.ts           # Lógica principal, integração Firebase, ImgBB e carrinho
│       ├── app.html         # Estrutura visual da vitrine e painel de administração restrito
│       ├── app.scss         # Variáveis de cor, design responsivo e animações
│       └── app.config.ts    # Configurações globais e chaves de ambiente do Firebase
└── angular.json             # Configurações do compilador Angular

```

---

## ⚙️ Como Configurar e Executar

1. **Pré-requisitos:** Certifique-se de que tem o Node.js e o Angular CLI instalados na sua máquina.


2. **Instalar Dependências:** Na raiz do projeto, execute o comando de instalação do Node e instale os pacotes do Firebase:

```bash
npm install
npm install firebase @angular/fire

```

3. **Credenciais:** Certifique-se de que o ficheiro `src/app/app.config.ts` contém as chaves válidas do seu projeto Firebase.
4. **Executar o Servidor de Desenvolvimento:**

```bash
ng serve

```

5. **Visualizar a Aplicação:** Abra o navegador e aceda a `http://localhost:4200`.



---

## 📝 Como Atualizar o Cardápio (Painel do Administrador)

A gestão do menu é feita inteiramente através de uma interface visual e amigável integrada no próprio site. Não é necessário editar código.

### 1. Acesso à Área Restrita

1. Desça a página inicial até ao rodapé (onde se lê "Todos os direitos reservados").


2. Clique no ícone de engrenagem (**⚙️**).


3. Na janela de login, insira o e-mail e a palavra-passe registados pela equipa.

### 2. Cadastrar ou Editar Pratos

* **Para Cadastrar:** Preencha os campos com o Nome do Prato, Descrição, Preço e clique em "Escolher ficheiro" para anexar a fotografia. Clique em "Salvar Produto". O sistema fará o upload para a nuvem automaticamente.
* **Para Editar:** Na lista de pratos ativos logo abaixo do formulário, clique no ícone do lápis (**✏️**). Os dados subirão para o formulário para poderem ser corrigidos.
* **Para Excluir:** Clique no ícone de reciclagem vermelho (**🗑️**) ao lado do produto. O prato desaparecerá imediatamente do menu dos clientes.

---

## 👨‍💻 Autor

Desenvolvido e arquitetado por **Marcos André Díaz Farias**.
*Engenharia de Software • Desenvolvimento Backend e Frontend • Automação e Integrações*

```

```