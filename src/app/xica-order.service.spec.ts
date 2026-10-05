import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  Firestore,
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  updateDoc,
} from '@angular/fire/firestore';
import { XicaOrderService } from './xica-order.service';

vi.mock('@angular/fire/firestore', () => ({
  Firestore: class MockFirestore {},
  collection: vi.fn((_fs, path) => ({ path })),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  doc: vi.fn((_fs, path, id) => ({ path, id })),
  query: vi.fn((_ref, ..._args) => ({ ref: _ref })),
  orderBy: vi.fn((_field, _direction) => ({ field: _field, direction: _direction })),
  runTransaction: vi.fn(),
  updateDoc: vi.fn(),
}));

describe('XicaOrderService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [{ provide: Firestore, useValue: {} }],
    });
  });

  it('loads the order queue ordered by creation date descending', async () => {
    const pedidos = [
      {
        id: 'pedido-1',
        codigo: '250101-1234',
        total: 42.5,
        criadoEm: '2026-10-05T12:00:00.000Z',
        status: 'pendente',
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
        }),
      })),
    } as any);

    const service = TestBed.inject(XicaOrderService);

    const lista = await service.carregarPedidosAdmin();

    expect(query).toHaveBeenCalled();
    expect(orderBy).toHaveBeenCalledWith('criadoEm', 'desc');
    expect(lista).toHaveLength(1);
    expect(lista[0].codigo).toBe('250101-1234');
  });

  it('updates the status of an order', async () => {
    vi.mocked(updateDoc).mockResolvedValueOnce(undefined);
    const service = TestBed.inject(XicaOrderService);

    await service.atualizarStatusPedido('pedido-1', 'aceito');

    expect(doc).toHaveBeenCalledWith(expect.anything(), 'pedidos', 'pedido-1');
    expect(updateDoc).toHaveBeenCalledWith(expect.anything(), { status: 'aceito' });
  });

  it('generates a sequential order code when Firestore transactions are available', async () => {
    vi.mocked(runTransaction).mockImplementation(async (_fs, updater) => await updater({
      get: vi.fn().mockResolvedValue({ exists: () => false, data: () => ({}) }),
      set: vi.fn(),
    } as any));

    const service = TestBed.inject(XicaOrderService);
    const code = await service.gerarCodigoPedido();

    expect(runTransaction).toHaveBeenCalled();
    expect(code).toMatch(/^\d{2}\d{2}\d{2}-\d{2}\d{2}-\d{3}$/);
  });

  it('reuses the existing monthly sequence when the counter already exists for this month', async () => {
    const hoje = new Date();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const mesAtual = `${hoje.getFullYear()}-${mes}`;

    vi.mocked(runTransaction).mockImplementation(async (_fs, updater) => await updater({
      get: vi.fn().mockResolvedValue({
        exists: () => true,
        data: () => ({ mes: mesAtual, sequencia: 5 }),
      }),
      set: vi.fn(),
    } as any));

    const service = TestBed.inject(XicaOrderService);
    const code = await service.gerarCodigoPedido();

    expect(code.endsWith('-006')).toBe(true);
  });

  it('falls back to an offline code when Firestore transactions fail', async () => {
    vi.mocked(runTransaction).mockRejectedValueOnce(new Error('offline'));
    const service = TestBed.inject(XicaOrderService);

    const code = await service.gerarCodigoPedido();

    expect(code).toMatch(/^\d{2}\d{2}\d{2}-\d{2}\d{2}-F\d{3}$/);
  });

  it('falls back to an offline code when the transaction result is not a finite number', async () => {
    vi.mocked(runTransaction).mockResolvedValueOnce('abc' as any);
    const service = TestBed.inject(XicaOrderService);

    const code = await service.gerarCodigoPedido();

    expect(code).toMatch(/^\d{2}\d{2}\d{2}-\d{2}\d{2}-F\d{3}$/);
  });

  it('restarts sequencing when the saved month is different from the current month', async () => {
    const hoje = new Date();
    const mesAnterior = `${hoje.getFullYear()}-${String(hoje.getMonth()).padStart(2, '0')}`;

    vi.mocked(runTransaction).mockImplementation(async (_fs, updater) => await updater({
      get: vi.fn().mockResolvedValue({
        exists: () => true,
        data: () => ({ mes: mesAnterior, sequencia: 9 }),
      }),
      set: vi.fn(),
    } as any));

    const service = TestBed.inject(XicaOrderService);
    const code = await service.gerarCodigoPedido();

    expect(code.endsWith('-001')).toBe(true);
  });

  it('saves the order with status pendente and current total', async () => {
    vi.mocked(runTransaction).mockResolvedValueOnce(12);
    vi.mocked(addDoc).mockResolvedValueOnce({} as any);
    const service = TestBed.inject(XicaOrderService);

    await service.salvarPedido([
      { produto: { id: '1', nome: 'Item', descricao: 'Desc', preco: 15 }, quantidade: 2 },
    ], 30);

    expect(addDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      status: 'pendente',
      total: 30,
      itens: [{ produto: { id: '1', nome: 'Item', descricao: 'Desc', preco: 15 }, quantidade: 2 }],
    }));
  });
});
