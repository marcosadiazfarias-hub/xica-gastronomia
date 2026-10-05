import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';
import { CartService } from './cart.service';

describe('CartService', () => {
  let service: CartService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(CartService);
  });

  it('saves cart to localStorage with current date', () => {
    const itens = [{ produto: { id: '1', nome: 'X', descricao: 'desc', preco: 15 }, quantidade: 2 }];

    service.salvarCarrinho(itens);

    const saved = JSON.parse(localStorage.getItem('xicas_carrinho_diario') || '{}');
    expect(saved.data).toBe(service.obterDataAtual());
    expect(saved.itens).toEqual(itens);
  });

  it('restores cart when stored data matches today', () => {
    const itens = [{ produto: { id: '2', nome: 'Y', descricao: 'desc', preco: 20 }, quantidade: 3 }];
    localStorage.setItem('xicas_carrinho_diario', JSON.stringify({ data: service.obterDataAtual(), itens }));

    expect(service.carregarCarrinho()).toEqual(itens);
  });

  it('clears cart and removes storage when stored data is from an earlier day', () => {
    const itens = [{ produto: { id: '3', nome: 'Z', descricao: 'desc', preco: 10 }, quantidade: 1 }];
    localStorage.setItem('xicas_carrinho_diario', JSON.stringify({ data: '2020-01-01', itens }));

    expect(service.carregarCarrinho()).toEqual([]);
    expect(localStorage.getItem('xicas_carrinho_diario')).toBeNull();
  });

  it('calculates grand total and item count', () => {
    const itens = [
      { produto: { id: '1', nome: 'A', descricao: 'desc', preco: 10 }, quantidade: 2 },
      { produto: { id: '2', nome: 'B', descricao: 'desc', preco: 7.5 }, quantidade: 1 },
    ];

    expect(service.total(itens)).toBe(27.5);
    expect(service.totalItens(itens)).toBe(3);
  });
});
