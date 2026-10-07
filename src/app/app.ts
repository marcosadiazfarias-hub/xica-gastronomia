import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { CartService, ItemCarrinho } from './cart.service';
import { XicaAuthService } from './xica-auth.service';
import { XicaDataService, Produto } from './xica-data.service';
import { XicaOrderService } from './xica-order.service';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  mostrarModalLGPD = false;
  nomeCliente = environment.cliente.nome;
  private readonly whatsappPhoneNumber = environment.cliente.whatsapp;
  private readonly titleService = inject(Title);

  produtos: Produto[] = [];
  carrinho: ItemCarrinho[] = [];
  mostrarAvisoCookies = false;

  private readonly cartService = inject(CartService);
  private readonly xicaAuthService = inject(XicaAuthService);
  private readonly xicaDataService = inject(XicaDataService);
  private readonly xicaOrderService = inject(XicaOrderService);

  modoAdmin = false;
  abaAdmin: 'cardapio' | 'pedidos' = 'pedidos';
  listaPedidos: any[] = [];
  usuarioAutenticado = false;
  credenciais = { email: '', senha: '' };
  produtoForm: Produto = { id: '', nome: '', descricao: '', preco: 0, imagem: '' };
  editando = false;

  arquivoSelecionado: File | null = null;
  aCarregarImagem = false;

  constructor(private cdr: ChangeDetectorRef) {}

  abrirLGPD() {
    this.mostrarModalLGPD = true;
    document.body.style.overflow = 'hidden';
  }

  fecharLGPD() {
    this.mostrarModalLGPD = false;
    document.body.style.overflow = '';
  }

  ngOnInit() {
    this.titleService.setTitle(`${this.nomeCliente} | Cardápio Digital`);
    this.verificarConsentimentoCookies();
    this.carregarCardapio();
    this.carregarCarrinho();

    this.xicaAuthService.authState$().subscribe(user => {
      this.usuarioAutenticado = !!user;
      if (user) {
        this.carregarPedidosAdmin();
      }
      this.cdr.detectChanges();
    });
  }

  async carregarPedidosAdmin() {
    if (!this.usuarioAutenticado) return;
    try {
      this.listaPedidos = await this.xicaOrderService.carregarPedidosAdmin();
      this.cdr.detectChanges();
    } catch (erro) {
      console.error('Erro ao carregar pedidos:', erro);
    }
  }

  async atualizarStatusPedido(pedidoId: string, novoStatus: string) {
    try {
      await this.xicaOrderService.atualizarStatusPedido(pedidoId, novoStatus);
      await this.carregarPedidosAdmin();
    } catch (erro) {
      alert('Erro ao atualizar status.');
    }
  }

  // =========================================
  //   LÓGICA DE ADMINISTRAÇÃO E CRUD
  // =========================================

  abrirPainelAdmin() {
    this.modoAdmin = !this.modoAdmin;
    if (this.modoAdmin) window.scrollTo(0, 0); 
  }

  async fazerLogin() {
    if (!this.credenciais.email || !this.credenciais.senha) return;
    try {
      await this.xicaAuthService.login(this.credenciais.email, this.credenciais.senha);
      this.credenciais = { email: '', senha: '' }; 
    } catch (erro: any) {
      console.error(erro);
      alert('Acesso Negado (Código: ' + erro.code + ')');
    }
  }

  async recuperarSenha() {
    if (!this.credenciais.email) {
      alert('Por favor, digite o seu e-mail no campo acima e clique em "Esqueci a Senha".');
      return;
    }
    try {
      await this.xicaAuthService.recuperarSenha(this.credenciais.email);
      alert('E-mail de recuperação enviado! Verifique a sua caixa de entrada.');
    } catch (erro: any) {
      console.error(erro);
      alert('Erro ao enviar (Código: ' + erro.code + ')');
    }
  }

  async fazerLogout() {
    await this.xicaAuthService.logout();
    this.modoAdmin = false;
  }

  selecionarImagem(event: any) {
    if (event.target.files && event.target.files[0]) {
      this.arquivoSelecionado = event.target.files[0];
    }
  }

  async salvarProduto() {
    this.aCarregarImagem = true;
    try {
      await this.xicaDataService.salvarProduto(this.produtoForm, this.arquivoSelecionado, this.editando);
      this.cancelarEdicao();
      await this.carregarCardapio();
    } catch (erro) {
      console.error('Erro ao salvar:', erro);
      alert('Ocorreu um erro ao salvar o prato. Verifique a sua ligação.');
    } finally {
      this.aCarregarImagem = false;
    }
  }

  editarProduto(produto: Produto) {
    this.editando = true;
    this.produtoForm = { ...produto }; 
    window.scrollTo(0, 0);
  }

  async excluirProduto(id: string) {
    if (confirm('Tem a certeza absoluta de que deseja excluir este prato do menu?')) {
      try {
        await this.xicaDataService.excluirProduto(id);
        await this.carregarCardapio();
      } catch (erro) {
        alert('Erro ao tentar excluir.');
      }
    }
  }

  cancelarEdicao() {
    this.editando = false;
    this.produtoForm = { id: '', nome: '', descricao: '', preco: 0, imagem: '' };
    this.arquivoSelecionado = null;
  }

  // =========================================
  //   LÓGICA DE COOKIES E CARRINHO
  // =========================================

  verificarConsentimentoCookies() {
    const consentimento = localStorage.getItem('xicas_cookies_aceites');
    if (!consentimento) this.mostrarAvisoCookies = true;
  }

  aceitarCookies() {
    localStorage.setItem('xicas_cookies_aceites', 'true');
    this.mostrarAvisoCookies = false;
  }

  obterDataAtual(): string {
    return this.cartService.obterDataAtual();
  }

  salvarCarrinho() {
    this.cartService.salvarCarrinho(this.carrinho);
  }

  carregarCarrinho() {
    this.carrinho = this.cartService.carregarCarrinho();
  }

  async carregarCardapio() {
    try {
      this.produtos = await this.xicaDataService.carregarCardapio();
      this.cdr.detectChanges();
    } catch (erro) {
      console.error('Erro ao conectar com o banco de dados:', erro);
    }
  }

  get total(): number {
    return this.cartService.total(this.carrinho);
  }

  get totalItens(): number {
    return this.cartService.totalItens(this.carrinho);
  }

  adicionarAoCarrinho(produto: Produto) {
    const itemExistente = this.carrinho.find(item => item.produto.id === produto.id);
    if (itemExistente) {
      itemExistente.quantidade++;
    } else {
      this.carrinho.push({ produto, quantidade: 1 });
    }
    this.salvarCarrinho();
  }

  removerDoCarrinho(produtoId: string) {
    const index = this.carrinho.findIndex(item => item.produto.id === produtoId);
    if (index !== -1) {
      if (this.carrinho[index].quantidade > 1) {
        this.carrinho[index].quantidade--;
      } else {
        this.carrinho.splice(index, 1);
      }
      this.salvarCarrinho();
    }
  }

  async gerarCodigoPedido(): Promise<string> {
    return this.xicaOrderService.gerarCodigoPedido();
  }

  finalizarPedido() {
    if (this.carrinho.length === 0) return;

    const codigoPedido = this.xicaOrderService.gerarCodigoPedidoOffline();

    void this.xicaOrderService.salvarPedido(this.carrinho, this.total)
      .catch((erro) => {
        console.error('Erro ao salvar pedido no banco, mas enviando pro Whats...', erro);
      });

    let mensagem = `Olá *${this.nomeCliente}*! ${environment.cliente.mensagemPadrao}\n\n`;
    mensagem += `🎫 *PEDIDO:* #${codigoPedido}\n\n`;

    this.carrinho.forEach(item => {
      const subtotal = (item.produto.preco * item.quantidade).toFixed(2).replace('.', ',');
      mensagem += `🔸 ${item.quantidade}x ${item.produto.nome} (R$ ${subtotal})\n`;
    });

    mensagem += `\n💰 *Total do Pedido: R$ ${this.total.toFixed(2).replace('.', ',')}*`;
    mensagem += `\n📍 Aguardo a confirmação do tempo de preparo.`;

    const url = `https://wa.me/${this.whatsappPhoneNumber}?text=${encodeURIComponent(mensagem)}`;

    this.carrinho = [];
    this.salvarCarrinho();
    window.open(url, '_blank');
  }
}