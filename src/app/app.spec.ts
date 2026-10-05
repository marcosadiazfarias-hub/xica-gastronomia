import { TestBed, ComponentFixture } from '@angular/core/testing';
import { App } from './app';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  Firestore,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  runTransaction,
  query,
  orderBy,
} from '@angular/fire/firestore';
import {
  Auth,
  authState,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from '@angular/fire/auth';
import { BehaviorSubject } from 'rxjs';

const authSubject = new BehaviorSubject<any>(null);

vi.mock('@angular/fire/firestore', () => ({
  Firestore: class MockFirestore {},
  collection: vi.fn((_fs, path) => ({ path })),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  doc: vi.fn((_fs, path, id) => ({ path, id })),
  runTransaction: vi.fn(),
  query: vi.fn((_ref, ..._args) => ({ ref: _ref })),
  orderBy: vi.fn((_field, _direction) => ({ field: _field, direction: _direction })),
}));

vi.mock('@angular/fire/auth', () => ({
  Auth: class MockAuth {},
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  authState: vi.fn(() => authSubject.asObservable()),
  sendPasswordResetEmail: vi.fn(),
}));

const catalogoTeste = [
  {
    id: '1',
    nome: "Hambúrguer Xica's Clássico",
    descricao: 'Hambúrguer artesanal de teste.',
    preco: 32.9,
    imagem: '/images/hamburguer.jpg',
  },
  {
    id: '2',
    nome: 'Smash Burger Duplo',
    descricao: 'Smash burger de teste.',
    preco: 28.5,
  },
  {
    id: '3',
    nome: 'Mini Pudim Artesanal',
    descricao: 'Pudim de teste.',
    preco: 12,
  },
];

function createFirestoreDocsMock(produtos: typeof catalogoTeste) {
  return {
    docs: produtos.map(p => ({
      id: p.id,
      data: () => ({
        nome: p.nome,
        descricao: p.descricao,
        preco: p.preco,
        imagem: p.imagem,
      }),
    })),
  };
}

describe('App', () => {
  let fixture: ComponentFixture<App>;
  let component: App;

  beforeEach(async () => {
    localStorage.clear();
    authSubject.next(null);

    vi.mocked(runTransaction).mockReset();
    vi.mocked(query).mockClear();
    vi.mocked(orderBy).mockClear();
    vi.mocked(getDocs).mockResolvedValue(createFirestoreDocsMock(catalogoTeste) as any);

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        { provide: Firestore, useValue: {} },
        { provide: Auth, useValue: {} },
      ],
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

  it('loads the menu from Firestore cardapio collection', () => {
    expect(collection).toHaveBeenCalledWith(expect.anything(), 'cardapio');
    expect(getDocs).toHaveBeenCalled();
    expect(component.produtos).toEqual(catalogoTeste);
  });

  it('renders product images and a single fallback container when there is no image', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const productCards = compiled.querySelectorAll<HTMLElement>('.produto-card');

    expect(productCards[0].querySelector('.produto-img')?.getAttribute('src')).toBe(
      '/images/hamburguer.jpg'
    );
    expect(productCards[0].querySelector('.produto-img')?.getAttribute('alt')).toBe(
      catalogoTeste[0].nome
    );
    expect(productCards[1].querySelector('.img-fallback')).not.toBeNull();
    expect(productCards[1].querySelectorAll('.card-image-placeholder')).toHaveLength(1);
  });

  it('logs an error when Firestore fails to load the menu', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const firestoreError = new Error('Database offline');
    vi.mocked(getDocs).mockRejectedValueOnce(firestoreError);

    await component.carregarCardapio();

    expect(errorSpy).toHaveBeenCalledWith('Erro ao conectar com o banco de dados:', firestoreError);
  });

  it('renders internal navigation and a safe external iFood link', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const navigationLinks = Array.from(compiled.querySelectorAll('nav a')).map(link =>
      link.getAttribute('href')
    );
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

    component.removerDoCarrinho('999');

    expect(component.carrinho).toHaveLength(1);
    expect(component.carrinho[0].produto.id).toBe(component.produtos[0].id);
    expect(component.totalItens).toBe(1);
  });

  it('generates a sequential order code when Firestore transaction is available', async () => {
    vi.mocked(runTransaction).mockImplementation(async (_fs, updater) => {
      const transaction = {
        get: vi.fn().mockResolvedValue({
          exists: () => false,
          data: () => ({})
        }),
        set: vi.fn(),
      };
      return await updater(transaction as any);
    });

    const code = await component.gerarCodigoPedido();

    expect(runTransaction).toHaveBeenCalled();
    expect(code).toMatch(/^\d{2}\d{2}\d{2}-\d{2}\d{2}-\d{3}$/);
  });

  it('falls back to an offline order code when Firestore transactions are unavailable', async () => {
    vi.mocked(runTransaction).mockRejectedValueOnce(new Error('transaction unavailable'));

    const code = await component.gerarCodigoPedido();

    expect(runTransaction).toHaveBeenCalled();
    expect(code).toMatch(/^\d{2}\d{2}\d{2}-\d{2}\d{2}-F\d{3}$/);
  });

  it('keeps the checkout flow working even when saving the order to Firestore fails', async () => {
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
    vi.mocked(addDoc).mockRejectedValueOnce(new Error('Firestore failed'));
    component.carrinho = [{ produto: component.produtos[0], quantidade: 1 }];

    component.finalizarPedido();
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(openSpy).toHaveBeenCalledOnce();
    expect(addDoc).toHaveBeenCalled();
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

  describe('Cookies Consent', () => {
    it('shows the cookie banner when consent is not stored', () => {
      localStorage.removeItem('xicas_cookies_aceites');
      component.verificarConsentimentoCookies();
      expect(component.mostrarAvisoCookies).toBe(true);
    });

    it('does not show cookie banner when consent is already granted', () => {
      localStorage.setItem('xicas_cookies_aceites', 'true');
      component.mostrarAvisoCookies = false;
      component.verificarConsentimentoCookies();
      expect(component.mostrarAvisoCookies).toBe(false);
    });

    it('saves consent in localStorage and hides banner on aceitarCookies()', () => {
      component.mostrarAvisoCookies = true;
      component.aceitarCookies();

      expect(localStorage.getItem('xicas_cookies_aceites')).toBe('true');
      expect(component.mostrarAvisoCookies).toBe(false);
    });
  });

  describe('Cart Persistence and Expiration', () => {
    it('saves cart to localStorage with current date', () => {
      component.carrinho = [{ produto: catalogoTeste[0], quantidade: 2 }];
      component.salvarCarrinho();

      const saved = JSON.parse(localStorage.getItem('xicas_carrinho_diario') || '{}');
      expect(saved.data).toBe(component.obterDataAtual());
      expect(saved.itens).toEqual([{ produto: catalogoTeste[0], quantidade: 2 }]);
    });

    it('restores cart when stored data matches today', () => {
      const stored = {
        data: component.obterDataAtual(),
        itens: [{ produto: catalogoTeste[1], quantidade: 3 }],
      };
      localStorage.setItem('xicas_carrinho_diario', JSON.stringify(stored));

      component.carregarCarrinho();
      expect(component.carrinho).toEqual(stored.itens);
    });

    it('clears cart and removes storage when stored data is from an earlier day', () => {
      const stored = {
        data: '2020-01-01',
        itens: [{ produto: catalogoTeste[1], quantidade: 3 }],
      };
      localStorage.setItem('xicas_carrinho_diario', JSON.stringify(stored));

      component.carregarCarrinho();
      expect(component.carrinho).toEqual([]);
      expect(localStorage.getItem('xicas_carrinho_diario')).toBeNull();
    });
  });

  describe('Admin Panel and Authentication', () => {
    it('toggles admin panel mode and scrolls to top when opened', () => {
      const scrollSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

      expect(component.modoAdmin).toBe(false);
      component.abrirPainelAdmin();
      expect(component.modoAdmin).toBe(true);
      expect(scrollSpy).toHaveBeenCalledWith(0, 0);

      component.abrirPainelAdmin();
      expect(component.modoAdmin).toBe(false);
    });

    it('updates usuarioAutenticado when authState emits changes', () => {
      authSubject.next({ email: 'admin@xica.com' });
      fixture.detectChanges();
      expect(component.usuarioAutenticado).toBe(true);

      authSubject.next(null);
      fixture.detectChanges();
      expect(component.usuarioAutenticado).toBe(false);
    });

    it('does nothing on fazerLogin if credentials are incomplete', async () => {
      component.credenciais = { email: '', senha: '' };
      await component.fazerLogin();
      expect(signInWithEmailAndPassword).not.toHaveBeenCalled();

      component.credenciais = { email: 'admin@test.com', senha: '' };
      await component.fazerLogin();
      expect(signInWithEmailAndPassword).not.toHaveBeenCalled();
    });

    it('calls signInWithEmailAndPassword and clears credentials on success', async () => {
      vi.mocked(signInWithEmailAndPassword).mockResolvedValueOnce({} as any);
      component.credenciais = { email: 'admin@xica.com', senha: '123' };

      await component.fazerLogin();

      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'admin@xica.com',
        '123'
      );
      expect(component.credenciais).toEqual({ email: '', senha: '' });
    });

    it('handles login failure and alerts the error code', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(signInWithEmailAndPassword).mockRejectedValueOnce({
        code: 'auth/invalid-credential',
      });
      component.credenciais = { email: 'admin@xica.com', senha: 'wrong' };

      await component.fazerLogin();

      expect(errorSpy).toHaveBeenCalled();
      expect(alertSpy).toHaveBeenCalledWith('Acesso Negado (Código: auth/invalid-credential)');
    });

    it('alerts to provide email if empty during recuperarSenha', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      component.credenciais.email = '';

      await component.recuperarSenha();

      expect(sendPasswordResetEmail).not.toHaveBeenCalled();
      expect(alertSpy).toHaveBeenCalledWith(
        'Por favor, digite o seu e-mail no campo acima e clique em "Esqueci a Senha".'
      );
    });

    it('sends password reset email and notifies user on success', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      vi.mocked(sendPasswordResetEmail).mockResolvedValueOnce();
      component.credenciais.email = 'admin@xica.com';

      await component.recuperarSenha();

      expect(sendPasswordResetEmail).toHaveBeenCalledWith(expect.anything(), 'admin@xica.com');
      expect(alertSpy).toHaveBeenCalledWith(
        'E-mail de recuperação enviado! Verifique a sua caixa de entrada.'
      );
    });

    it('handles password reset error with alert', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(sendPasswordResetEmail).mockRejectedValueOnce({ code: 'auth/user-not-found' });
      component.credenciais.email = 'unknown@xica.com';

      await component.recuperarSenha();

      expect(errorSpy).toHaveBeenCalled();
      expect(alertSpy).toHaveBeenCalledWith('Erro ao enviar (Código: auth/user-not-found)');
    });

    it('calls signOut and closes admin mode on fazerLogout', async () => {
      vi.mocked(signOut).mockResolvedValueOnce();
      component.modoAdmin = true;

      await component.fazerLogout();

      expect(signOut).toHaveBeenCalled();
      expect(component.modoAdmin).toBe(false);
    });

    it('loads the order queue when the admin is authenticated', async () => {
      const pedidos = [
        {
          id: 'pedido-1',
          codigo: '250101-1234',
          total: 42.5,
          criadoEm: '2026-10-05T12:00:00.000Z',
          status: 'pendente',
          itens: [{ produto: catalogoTeste[0], quantidade: 1 }],
        },
      ];

      vi.mocked(getDocs).mockResolvedValueOnce({
        docs: pedidos.map(pedido => ({
          id: pedido.id,
          data: () => ({
            codigo: pedido.codigo,
            total: pedido.total,
            criadoEm: pedido.criadoEm,
            status: pedido.status,
            itens: pedido.itens,
          }),
        })),
      } as any);

      component.usuarioAutenticado = true;
      await component.carregarPedidosAdmin();

      expect(query).toHaveBeenCalled();
      expect(orderBy).toHaveBeenCalledWith('criadoEm', 'desc');
      expect(component.listaPedidos).toHaveLength(1);
      expect(component.listaPedidos[0].codigo).toBe('250101-1234');
    });

    it('updates the status of an order and refreshes the queue', async () => {
      vi.mocked(updateDoc).mockResolvedValueOnce();
      vi.mocked(getDocs).mockResolvedValueOnce({ docs: [] } as any);
      component.usuarioAutenticado = true;

      await component.atualizarStatusPedido('pedido-1', 'aceito');

      expect(doc).toHaveBeenCalledWith(expect.anything(), 'pedidos', 'pedido-1');
      expect(updateDoc).toHaveBeenCalledWith(expect.anything(), { status: 'aceito' });
      expect(component.listaPedidos).toEqual([]);
    });

    it('keeps the empty order queue state when there are no orders', () => {
      component.abrirPainelAdmin();
      component.usuarioAutenticado = true;
      component.abaAdmin = 'pedidos';
      component.listaPedidos = [];

      fixture.detectChanges();

      expect(component.modoAdmin).toBe(true);
      expect(component.usuarioAutenticado).toBe(true);
      expect(component.abaAdmin).toBe('pedidos');
      expect(component.listaPedidos).toEqual([]);
    });
  });

  describe('Product CRUD Operations', () => {
    it('sets arquivoSelecionado on selecionarImagem event', () => {
      const dummyFile = new File(['image-content'], 'prato.png', { type: 'image/png' });
      const event = { target: { files: [dummyFile] } };

      component.selecionarImagem(event);
      expect(component.arquivoSelecionado).toBe(dummyFile);
    });

    it('enters edit mode and copies product data into form on editarProduto', () => {
      const scrollSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
      const produto = catalogoTeste[0];

      component.editarProduto(produto);

      expect(component.editando).toBe(true);
      expect(component.produtoForm).toEqual(produto);
      expect(scrollSpy).toHaveBeenCalledWith(0, 0);
    });

    it('resets form and edit state on cancelarEdicao', () => {
      component.editando = true;
      component.produtoForm = { ...catalogoTeste[0] };
      component.arquivoSelecionado = new File([''], 'test.png');

      component.cancelarEdicao();

      expect(component.editando).toBe(false);
      expect(component.produtoForm).toEqual({
        id: '',
        nome: '',
        descricao: '',
        preco: 0,
        imagem: '',
      });
      expect(component.arquivoSelecionado).toBeNull();
    });

    it('creates a new product with addDoc when not in edit mode', async () => {
      vi.mocked(addDoc).mockResolvedValueOnce({} as any);
      component.editando = false;
      component.produtoForm = {
        id: '',
        nome: 'X-Bacon Especial',
        descricao: 'Bacon crocante',
        preco: 36,
        imagem: 'https://img.com/bacon.jpg',
      };

      await component.salvarProduto();

      expect(addDoc).toHaveBeenCalledWith(expect.anything(), {
        nome: 'X-Bacon Especial',
        descricao: 'Bacon crocante',
        preco: 36,
        imagem: 'https://img.com/bacon.jpg',
      });
      expect(component.editando).toBe(false);
    });

    it('updates an existing product with updateDoc when in edit mode', async () => {
      vi.mocked(updateDoc).mockResolvedValueOnce();
      component.editando = true;
      component.produtoForm = {
        id: '1',
        nome: 'Hambúrguer Editado',
        descricao: 'Nova descrição',
        preco: 35,
        imagem: 'https://img.com/editado.jpg',
      };

      await component.salvarProduto();

      expect(doc).toHaveBeenCalledWith(expect.anything(), 'cardapio', '1');
      expect(updateDoc).toHaveBeenCalledWith(expect.anything(), {
        nome: 'Hambúrguer Editado',
        descricao: 'Nova descrição',
        preco: 35,
        imagem: 'https://img.com/editado.jpg',
      });
      expect(component.editando).toBe(false);
    });

    it('uploads image to ImgBB when arquivoSelecionado is present before saving', async () => {
      const dummyFile = new File(['img'], 'foto.jpg', { type: 'image/jpeg' });
      component.arquivoSelecionado = dummyFile;
      component.editando = false;
      component.produtoForm = {
        id: '',
        nome: 'Prato com Foto',
        descricao: 'Desc',
        preco: 20,
        imagem: '',
      };

      const fetchMock = vi.fn().mockResolvedValue({
        json: vi.fn().mockResolvedValue({
          success: true,
          data: { url: 'https://i.ibb.co/uploaded.jpg' },
        }),
      });
      vi.stubGlobal('fetch', fetchMock);

      await component.salvarProduto();

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('api.imgbb.com/1/upload'),
        expect.objectContaining({ method: 'POST' })
      );
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ imagem: 'https://i.ibb.co/uploaded.jpg' })
      );
    });

    it('handles image upload failure and alerts the error', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const dummyFile = new File(['img'], 'foto.jpg', { type: 'image/jpeg' });
      component.arquivoSelecionado = dummyFile;

      const fetchMock = vi.fn().mockResolvedValue({
        json: vi.fn().mockResolvedValue({
          success: false,
        }),
      });
      vi.stubGlobal('fetch', fetchMock);

      await component.salvarProduto();

      expect(errorSpy).toHaveBeenCalled();
      expect(alertSpy).toHaveBeenCalledWith(
        'Ocorreu um erro ao salvar o prato. Verifique a sua ligação.'
      );
      expect(component.aCarregarImagem).toBe(false);
    });

    it('deletes a product when confirmed', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      vi.mocked(deleteDoc).mockResolvedValueOnce();

      await component.excluirProduto('1');

      expect(doc).toHaveBeenCalledWith(expect.anything(), 'cardapio', '1');
      expect(deleteDoc).toHaveBeenCalled();
    });

    it('cancels deletion when user declines confirm', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);

      await component.excluirProduto('1');

      expect(deleteDoc).not.toHaveBeenCalled();
    });

    it('alerts on deletion error', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      vi.mocked(deleteDoc).mockRejectedValueOnce(new Error('Delete error'));

      await component.excluirProduto('1');

      expect(alertSpy).toHaveBeenCalledWith('Erro ao tentar excluir.');
    });
  });
});
