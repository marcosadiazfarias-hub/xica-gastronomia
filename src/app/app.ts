import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Produto {
  id: number;
  nome: string;
  descricao: string;
  preco: number;
  imagem?: string; // <- Nova linha adicionada
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
  
  // Injetamos o ChangeDetectorRef no construtor
  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.carregarCardapio();
  }

 async carregarCardapio() {
    try {
      // O caminho foi alterado para apontar diretamente para a raiz (pasta public)
      const resposta = await fetch('/cardapio.json');
      
      if (resposta.ok) {
        this.produtos = await resposta.json();
        
        // Força o Angular a atualizar o ecrã com os novos dados
        this.cdr.detectChanges();
        
      } else {
        console.error('Erro ao carregar o cardápio:', resposta.statusText);
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
  }

  removerDoCarrinho(produtoId: number) {
    const index = this.carrinho.findIndex(item => item.produto.id === produtoId);
    
    if (index !== -1) {
      if (this.carrinho[index].quantidade > 1) {
        this.carrinho[index].quantidade--;
      } else {
        this.carrinho.splice(index, 1);
      }
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
    
    window.open(url, '_blank');
  }
}