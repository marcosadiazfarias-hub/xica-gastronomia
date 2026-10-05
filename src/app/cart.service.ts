import { Injectable } from '@angular/core';
import { Produto } from './xica-data.service';

export interface ItemCarrinho {
  produto: Produto;
  quantidade: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly storageKey = 'xicas_carrinho_diario';

  obterDataAtual(): string {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
  }

  salvarCarrinho(itens: ItemCarrinho[]): void {
    const estadoCarrinho = { data: this.obterDataAtual(), itens };
    localStorage.setItem(this.storageKey, JSON.stringify(estadoCarrinho));
  }

  carregarCarrinho(): ItemCarrinho[] {
    const dadosGuardados = localStorage.getItem(this.storageKey);
    if (!dadosGuardados) {
      return [];
    }

    const estadoCarrinho = JSON.parse(dadosGuardados);
    if (estadoCarrinho.data === this.obterDataAtual()) {
      return estadoCarrinho.itens ?? [];
    }

    localStorage.removeItem(this.storageKey);
    return [];
  }

  total(itens: ItemCarrinho[]): number {
    return itens.reduce((soma, item) => soma + (item.produto.preco * item.quantidade), 0);
  }

  totalItens(itens: ItemCarrinho[]): number {
    return itens.reduce((total, item) => total + item.quantidade, 0);
  }
}
