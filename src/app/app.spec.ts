import { TestBed, ComponentFixture } from '@angular/core/testing';
import { App } from './app';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('App', () => {
  let fixture: ComponentFixture<App>;
  let component: App;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();

    fixture = TestBed.createComponent(App);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => vi.restoreAllMocks());

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it('renders the home title and all products', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('h1')?.textContent).toContain('Sabor e Amor');
    expect(compiled.querySelector('h1')?.textContent).toContain('Sobre Rodas');
    expect(compiled.querySelectorAll('.produto-card')).toHaveLength(component.produtos.length);
  });

  it('adds products from the menu and updates the formatted total', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const addButtons = compiled.querySelectorAll<HTMLButtonElement>('.btn-icon');

    addButtons[0].click();
    addButtons[1].click();
    fixture.detectChanges();

    expect(component.carrinho).toHaveLength(2);
    expect(component.total).toBe(50.5);
    expect(compiled.querySelector('.total-carrinho')?.textContent).toContain('R$ 50,50');
    expect(compiled.querySelector('.cart-count')?.textContent).toContain('2 itens');
  });

  it('groups repeated products and updates quantity, subtotal, and item count', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const addButton = compiled.querySelector<HTMLButtonElement>('.btn-icon');

    addButton?.click();
    fixture.detectChanges();
    expect(compiled.querySelector('.cart-count')?.textContent).toContain('1 item');

    addButton?.click();
    fixture.detectChanges();

    expect(component.carrinho).toHaveLength(1);
    expect(component.carrinho[0].quantidade).toBe(2);
    expect(component.totalItens).toBe(2);
    expect(component.total).toBe(71);
    expect(compiled.querySelector('.cart-count')?.textContent).toContain('2 itens');
    expect(compiled.querySelector('.item-subtotal')?.textContent).toContain('R$ 71,00');
  });

  it('decreases quantity and removes the product when it reaches zero', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const addButton = compiled.querySelector<HTMLButtonElement>('.btn-icon');
    addButton?.click();
    fixture.detectChanges();
    addButton?.click();
    fixture.detectChanges();

    const decreaseButton = compiled.querySelector<HTMLButtonElement>('.item-controles .btn-qtd');
    expect(decreaseButton?.textContent?.trim()).toBe('-');
    decreaseButton?.click();
    fixture.detectChanges();

    expect(component.carrinho[0].quantidade).toBe(1);
    expect(component.total).toBe(35.5);

    compiled.querySelector<HTMLButtonElement>('.item-controles .btn-qtd')?.click();
    fixture.detectChanges();

    expect(component.carrinho).toHaveLength(0);
    expect(compiled.querySelector('#carrinho-resumo')).toBeNull();
  });

  it('does not open WhatsApp when the cart is empty', () => {
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);

    component.finalizarPedido();

    expect(openSpy).not.toHaveBeenCalled();
  });

  it('opens WhatsApp with the encoded order and total', () => {
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
    component.adicionarAoCarrinho(component.produtos[0]);
    component.adicionarAoCarrinho(component.produtos[0]);
    component.adicionarAoCarrinho(component.produtos[1]);

    component.finalizarPedido();

    expect(openSpy).toHaveBeenCalledOnce();
    const [address, target] = openSpy.mock.calls[0];
    const url = new URL(address as string);
    const message = url.searchParams.get('text');

    expect(target).toBe('_blank');
    expect(url.hostname).toBe('wa.me');
    expect(message).toContain(`2x ${component.produtos[0].nome} (R$ 71,00)`);
    expect(message).toContain(`1x ${component.produtos[1].nome} (R$ 15,00)`);
    expect(message).toContain('Total do Pedido: R$ 86,00');
  });
});
