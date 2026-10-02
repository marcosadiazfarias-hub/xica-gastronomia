import { TestBed, ComponentFixture } from '@angular/core/testing';
import { App } from './app';
import { afterEach, describe, expect, it, vi } from 'vitest';

const catalogoTeste = [
  {
    id: 1,
    nome: "Hambúrguer Xica's Clássico",
    descricao: 'Hambúrguer artesanal de teste.',
    preco: 32.9,
    imagem: '/images/hamburguer.jpg',
  },
  {
    id: 2,
    nome: 'Smash Burger Duplo',
    descricao: 'Smash burger de teste.',
    preco: 28.5,
  },
  {
    id: 3,
    nome: 'Mini Pudim Artesanal',
    descricao: 'Pudim de teste.',
    preco: 12,
  },
];

describe('App', () => {
  let fixture: ComponentFixture<App>;
  let component: App;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(catalogoTeste),
    });
    vi.stubGlobal('fetch', fetchMock);

    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();

    fixture = TestBed.createComponent(App);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it('renders the home title and all products', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('h1')?.textContent).toContain('Sabor e Amor');
    expect(compiled.querySelector('h1')?.textContent).toContain('Sobre Rodas');
    expect(compiled.querySelectorAll('.produto-card')).toHaveLength(component.produtos.length);
  });

  it('loads the menu from the public JSON file', () => {
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith('/cardapio.json');
    expect(component.produtos).toEqual(catalogoTeste);
  });

  it('renders product images and a single fallback container when there is no image', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const productCards = compiled.querySelectorAll<HTMLElement>('.produto-card');

    expect(productCards[0].querySelector('.produto-img')?.getAttribute('src')).toBe('/images/hamburguer.jpg');
    expect(productCards[0].querySelector('.produto-img')?.getAttribute('alt')).toBe(catalogoTeste[0].nome);
    expect(productCards[1].querySelector('.img-fallback')).not.toBeNull();
    expect(productCards[1].querySelectorAll('.card-image-placeholder')).toHaveLength(1);
  });

  it('logs an HTTP error and keeps the current catalog when the response is not ok', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const response = { ok: false, statusText: 'Not Found' };
    fetchMock.mockResolvedValueOnce(response);

    await component.carregarCardapio();

    expect(errorSpy).toHaveBeenCalledWith('Erro ao carregar o cardápio:', 'Not Found');
    expect(component.produtos).toEqual(catalogoTeste);
  });

  it('logs a network error and keeps the current catalog when fetch rejects', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const networkError = new Error('offline');
    fetchMock.mockRejectedValueOnce(networkError);

    await component.carregarCardapio();

    expect(errorSpy).toHaveBeenCalledWith('Erro de rede ao tentar carregar o cardápio:', networkError);
    expect(component.produtos).toEqual(catalogoTeste);
  });

  it('renders internal navigation and a safe external iFood link', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const navigationLinks = Array.from(compiled.querySelectorAll('nav a')).map(link => link.getAttribute('href'));
    const ifoodLink = compiled.querySelector<HTMLAnchorElement>('.btn-ifood');

    expect(navigationLinks).toEqual(['#inicio', '#cardapio', '#ifood']);
    expect(ifoodLink?.href).toBe('https://www.ifood.com.br/');
    expect(ifoodLink?.target).toBe('_blank');
    expect(ifoodLink?.rel).toContain('noopener');
  });

  it('adds products from the menu and updates the formatted total', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const addButtons = compiled.querySelectorAll<HTMLButtonElement>('.btn-icon');

    addButtons[0].click();
    addButtons[1].click();
    fixture.detectChanges();

    expect(component.carrinho).toHaveLength(2);
    expect(component.total).toBe(61.4);
    expect(compiled.querySelector('.total-carrinho')?.textContent).toContain('R$ 61,40');
    expect(compiled.querySelector('.cart-count')?.textContent).toContain('2 itens');
  });

  it('groups repeated products and updates quantity, subtotal, and item count', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const addButton = compiled.querySelector<HTMLButtonElement>('.btn-icon');

    addButton?.click();
    fixture.detectChanges();
    expect(compiled.querySelector('.cart-count')?.textContent).toContain('1 item');

    compiled.querySelector<HTMLButtonElement>('.item-controles .btn-qtd:last-child')?.click();
    fixture.detectChanges();

    expect(component.carrinho).toHaveLength(1);
    expect(component.carrinho[0].quantidade).toBe(2);
    expect(component.totalItens).toBe(2);
    expect(component.total).toBe(65.8);
    expect(compiled.querySelector('.cart-count')?.textContent).toContain('2 itens');
    expect(compiled.querySelector('.item-subtotal')?.textContent).toContain('R$ 65,80');
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
    expect(component.total).toBe(32.9);

    compiled.querySelector<HTMLButtonElement>('.item-controles .btn-qtd')?.click();
    fixture.detectChanges();

    expect(component.carrinho).toHaveLength(0);
    expect(compiled.querySelector('#carrinho-resumo')).toBeNull();
  });

  it('ignores removal requests for products that are not in the cart', () => {
    component.adicionarAoCarrinho(component.produtos[0]);

    component.removerDoCarrinho(999);

    expect(component.carrinho).toHaveLength(1);
    expect(component.carrinho[0].produto.id).toBe(component.produtos[0].id);
    expect(component.totalItens).toBe(1);
  });

  it('does not open WhatsApp when the cart is empty', () => {
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);

    component.finalizarPedido();

    expect(openSpy).not.toHaveBeenCalled();
  });

  it('opens WhatsApp with the encoded order and total', () => {
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
    const compiled = fixture.nativeElement as HTMLElement;
    compiled.querySelectorAll<HTMLButtonElement>('.btn-icon')[0].click();
    fixture.detectChanges();

    compiled.querySelector<HTMLButtonElement>('.item-controles .btn-qtd:last-child')?.click();
    fixture.detectChanges();
    compiled.querySelectorAll<HTMLButtonElement>('.btn-icon')[1].click();
    fixture.detectChanges();

    const checkoutButton = compiled.querySelector<HTMLButtonElement>('.whatsapp-btn');
    expect(checkoutButton).not.toBeNull();
    checkoutButton?.click();

    expect(openSpy).toHaveBeenCalledOnce();
    const [address, target] = openSpy.mock.calls[0];
    const url = new URL(address as string);
    const message = url.searchParams.get('text');

    expect(target).toBe('_blank');
    expect(url.hostname).toBe('wa.me');
    expect(message).toContain(`2x ${component.produtos[0].nome} (R$ 65,80)`);
    expect(message).toContain(`1x ${component.produtos[1].nome} (R$ 28,50)`);
    expect(message).toContain('Total do Pedido: R$ 94,30');
  });
});
