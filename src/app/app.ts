import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Produto {
  id: number;
  nome: string;
  descricao: string;
  preco: number;
  imagem?: string;
}

interface ItemCarrinho {
  produto: Produto;
  quantidade: number;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  produtos: Produto[] = [];
  carrinho: ItemCarrinho[] = [];
  mostrarAvisoCookies: boolean = false;
  
  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.verificarConsentimentoCookies();
    this.carregarCardapio();
    this.carregarCarrinho();
  }

  // --- LÓGICA DE COOKIES E ESTADO DO CARRINHO ---

  verificarConsentimentoCookies() {
    const consentimento = localStorage.getItem('xicas_cookies_aceites');
    if (!consentimento) {
      this.mostrarAvisoCookies = true;
    }
  }

  aceitarCookies() {
    localStorage.setItem('xicas_cookies_aceites', 'true');
    this.mostrarAvisoCookies = false;
  }

  obterDataAtual(): string {
    const hoje = new Date();
    // Retorna formato AAAA-MM-DD
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
  }

  salvarCarrinho() {
    const estadoCarrinho = {
      data: this.obterDataAtual(),
      itens: this.carrinho
    };
    localStorage.setItem('xicas_carrinho_diario', JSON.stringify(estadoCarrinho));
  }

  carregarCarrinho() {
    const dadosGuardados = localStorage.getItem('xicas_carrinho_diario');
    
    if (dadosGuardados) {
      const estadoCarrinho = JSON.parse(dadosGuardados);
      
      // Verifica se o carrinho guardado é do dia de hoje
      if (estadoCarrinho.data === this.obterDataAtual()) {
        this.carrinho = estadoCarrinho.itens;
      } else {
        // Se for de um dia anterior, limpa o registo antigo
        localStorage.removeItem('xicas_carrinho_diario');
        this.carrinho = [];
      }
    }
  }

  // --- LÓGICA DO CARDÁPIO ---

  async carregarCardapio() {
    try {
      const resposta = await fetch('/cardapio.json');
      if (resposta.ok) {
        this.produtos = await resposta.json();
        this.cdr.detectChanges();
      }
    } catch (erro) {
      console.error('Erro de rede ao tentar carregar o cardápio:', erro);
    }
  }

  get total(): number {
    return this.carrinho.reduce((soma, item) => soma + (item.produto.preco * item.quantidade), 0);
  }

  get totalItens(): number {
    return this.carrinho.reduce((total, item) => total + item.quantidade, 0);
  }

  adicionarAoCarrinho(produto: Produto) {
    const itemExistente = this.carrinho.find(item => item.produto.id === produto.id);
    
    if (itemExistente) {
      itemExistente.quantidade++;
    } else {
      this.carrinho.push({ produto, quantidade: 1 });
    }
    this.salvarCarrinho(); // Guarda a alteração
  }

  removerDoCarrinho(produtoId: number) {
    const index = this.carrinho.findIndex(item => item.produto.id === produtoId);
    
    if (index !== -1) {
      if (this.carrinho[index].quantidade > 1) {
        this.carrinho[index].quantidade--;
      } else {
        this.carrinho.splice(index, 1);
      }
      this.salvarCarrinho(); // Guarda a alteração
    }
  }

  finalizarPedido() {
    if (this.carrinho.length === 0) return;
    
    let mensagem = "Olá *Xica's Gastronomia*! Gostaria de fazer o seguinte pedido para retirada no Food Truck:\n\n";
    
    this.carrinho.forEach(item => {
      const subtotal = (item.produto.preco * item.quantidade).toFixed(2).replace('.', ',');
      mensagem += `🔸 ${item.quantidade}x ${item.produto.nome} (R$ ${subtotal})\n`;
    });
    
    mensagem += `\n💰 *Total do Pedido: R$ ${this.total.toFixed(2).replace('.', ',')}*`;
    mensagem += `\n📍 Aguardo a confirmação do tempo de preparo.`;
    
    const telefoneWhatsApp = "5548999999999"; 
    const url = `https://wa.me/${telefoneWhatsApp}?text=${encodeURIComponent(mensagem)}`;
    
    // Limpa o carrinho após finalizar o pedido para não acumular no dia
    this.carrinho = [];
    this.salvarCarrinho();
    
    window.open(url, '_blank');
  }
}