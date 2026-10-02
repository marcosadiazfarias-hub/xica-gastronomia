```markdown
# 🍔 Xica's Gastronomia - Menu Digital & Pedidos

Uma aplicação web moderna, responsiva e focada na experiência do utilizador (UX) construída para digitalizar o atendimento de um Food Truck premium. O sistema funciona como um cardápio digital interativo com gestão de carrinho local e integração direta para finalização de pedidos via WhatsApp.

---

## 🚀 Funcionalidades Principais

* **Design Premium (Dark Mode Exclusivo):** Interface desenvolvida inteiramente sem a utilização da cor branca, aplicando uma paleta de tons de café (`#1a1615`), vermelho bordô e dourado. Elementos de *glassmorphism* (fundos translúcidos com desfoque) proporcionam um aspeto moderno.
* **Carrinho de Compras Adaptativo:** 
  * **Desktop:** Apresenta-se como uma barra lateral fixa (Side-bar) à direita, redimensionando automaticamente a grelha de produtos para evitar sobreposições.
  * **Mobile:** Transforma-se numa aba inferior nativa (Bottom-sheet) fixada à base do ecrã, maximizando a área de visualização e facilitando o uso com uma só mão.
* **Persistência de Dados (Local Storage):** O estado do carrinho é guardado no navegador do utilizador associado à data atual. Se o cliente fechar a página e voltar no mesmo dia, o pedido continua lá. No dia seguinte, o carrinho é limpo automaticamente.
* **Checkout via WhatsApp:** Ao finalizar, o sistema calcula os totais e formata uma mensagem de texto limpa e detalhada, redirecionando o utilizador diretamente para o WhatsApp do estabelecimento.
* **Gestão Dinâmica de Cardápio (No-Backend):** Os produtos não estão fixos no código. A aplicação consome os dados de forma assíncrona através de um ficheiro externo (`public/cardapio.json`), permitindo atualizações de ementa, preços e descrições sem necessidade de recompilar o projeto Angular.
* **Aviso de Privacidade / Cookies:** Banner interativo integrado para consentimento de utilização de armazenamento local (cumprimento de boas práticas web).
* **Tratamento Inteligente de Imagens:** Suporte nativo para imagens de produtos. Caso a imagem não esteja configurada no JSON, a interface gera automaticamente um ícone vetorial elegante (SVG de garfo e faca ou chapéu de chef) de forma transparente.

---

## 🛠️ Tecnologias Utilizadas

* **Framework:** Angular (v17+) com abordagem *Standalone Components* (sem `app.module.ts`).
* **Estilização:** SCSS (Sass) puro com variáveis CSS avançadas, *media queries* e animações *keyframes* customizadas.
* **Linguagem:** TypeScript e HTML5 semântico.
* **Integrações:** API Fetch (nativa do JavaScript) e WhatsApp Web/App API (`wa.me`).

---

## 📁 Estrutura de Ficheiros Relevantes

A arquitetura do projeto foi simplificada para facilitar a manutenção. Os ficheiros principais são:

```text
xica/
├── public/
│   ├── cardapio.json        # Base de dados em JSON com a ementa atual
│   ├── logo.jpg             # Logomarca do estabelecimento
│   └── favicon.ico          # Ícone do navegador
├── src/
│   └── app/
│       ├── app.ts           # Lógica principal (TypeScript), carrinho e integrações
│       ├── app.html         # Estrutura visual, componentes e laços de repetição (@for/@if)
│       └── app.scss         # Variáveis de cor, design responsivo e animações
└── angular.json             # Configurações do compilador Angular

```

---

## ⚙️ Como Configurar e Executar

1. **Pré-requisitos:** Certifique-se de que tem o [Node.js](https://nodejs.org/) e o [Angular CLI](https://angular.dev/tools/cli) instalados na sua máquina.
2. **Instalar Dependências:** Na raiz do projeto, execute:
```bash
npm install

```


3. **Executar o Servidor de Desenvolvimento:**
```bash
ng serve

```


4. **Visualizar a Aplicação:** Abra o navegador e aceda a `http://localhost:4200`.

---

## 📝 Como Atualizar o Cardápio (Guia Detalhado)

A gestão do menu foi desenhada para ser simples e não exigir conhecimentos avançados de programação nem acesso ao código fonte (TypeScript/HTML). Todo o cardápio é gerado a partir de um único ficheiro: **`public/cardapio.json`**.

### 1. Localização e Edição

Abra o ficheiro `public/cardapio.json` em qualquer editor de código (como o Visual Studio Code) ou até mesmo num bloco de notas simples. Vai encontrar uma lista de produtos entre parênteses retos `[ ]`, onde cada produto está isolado dentro de chavetas `{ }`.

### 2. Adicionar um Novo Produto

Para acrescentar um prato, copie o bloco de um produto existente, cole no local desejado (separando os blocos com uma vírgula) e altere os dados. O formato é o seguinte:

```json
{
  "id": 10,
  "nome": "Hambúrguer Especial",
  "descricao": "Pão brioche, blend 200g, queijo duplo e maionese verde.",
  "preco": 35.90,
  "imagem": "foto-especial.jpg"
}

```

**Regras de formatação obrigatórias:**

* **`id`**: Tem de ser um número único (nunca repita IDs, pois isso causa falhas no carrinho).
* **`preco`**: Utilize sempre **ponto (`.`)** em vez de vírgula para separar os cêntimos (ex: escreva `35.90` e não `35,90`). O sistema converte automaticamente para o formato visual correto ("R$ 35,90") no ecrã.
* **`imagem`**: Este campo é opcional. Se não colocar esta linha (ou se a remover), o sistema adapta-se automaticamente e exibe o ícone padrão do restaurante de forma elegante.

### 3. Inserir as Imagens dos Produtos

1. Guarde a fotografia do produto (recomenda-se o formato quadrado ou paisagem para melhor enquadramento) diretamente dentro da pasta **`public/`** (junto ao ficheiro `logo.jpg`).
2. No ficheiro `cardapio.json`, escreva o nome exato do ficheiro no campo `"imagem"`, garantindo que inclui a extensão (ex: `"hamburguer-classico.jpg"` ou `"porcao-fritas.png"`).

### 4. Modificar Preços ou Remover Pratos

* **Alterar preço:** Basta editar o valor numérico à frente de `"preco"` e guardar o ficheiro.
* **Remover prato:** Apague todo o bloco de código correspondente a esse produto, desde a chaveta de abertura `{` até à chaveta de fecho `}` (apagando também a vírgula que o separa do próximo, se houver).

*Nota: Não é necessário reiniciar o servidor (`ng serve`) ao fazer alterações no ficheiro JSON ou ao adicionar imagens. As atualizações refletem-se instantaneamente assim que o utilizador recarregar a página no navegador.*

---

## 👨‍💻 Autor

Desenvolvido e arquitetado por **Marcos André Díaz Farias**.
*Engenharia de Software • Desenvolvimento Backend e Frontend • Automação e Integrações*

```

```