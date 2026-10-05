import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  Firestore,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from '@angular/fire/firestore';
import { XicaDataService } from './xica-data.service';

vi.mock('@angular/fire/firestore', () => ({
  Firestore: class MockFirestore {},
  collection: vi.fn((_fs, path) => ({ path })),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  doc: vi.fn((_fs, path, id) => ({ path, id })),
}));

describe('XicaDataService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getDocs).mockResolvedValue({
      docs: [
        {
          id: '1',
          data: () => ({
            nome: 'Hambúrguer',
            descricao: 'Muito bom',
            preco: 25,
            imagem: '/img.png',
          }),
        },
      ],
    } as any);
    TestBed.configureTestingModule({
      providers: [{ provide: Firestore, useValue: {} }],
    });
  });

  it('loads the menu and maps Firestore documents to Produto objects', async () => {
    const service = TestBed.inject(XicaDataService);

    const produtos = await service.carregarCardapio();

    expect(collection).toHaveBeenCalledWith(expect.anything(), 'cardapio');
    expect(getDocs).toHaveBeenCalled();
    expect(produtos).toEqual([
      { id: '1', nome: 'Hambúrguer', descricao: 'Muito bom', preco: 25, imagem: '/img.png' },
    ]);
  });

  it('creates a new product in Firestore without image upload', async () => {
    vi.mocked(addDoc).mockResolvedValueOnce({} as any);
    const service = TestBed.inject(XicaDataService);

    await service.salvarProduto(
      { id: '', nome: 'X-Bacon', descricao: 'Bacon', preco: 28, imagem: 'https://img.com/x-bacon.jpg' },
      null,
      false
    );

    expect(addDoc).toHaveBeenCalledWith(expect.anything(), {
      nome: 'X-Bacon',
      descricao: 'Bacon',
      preco: 28,
      imagem: 'https://img.com/x-bacon.jpg',
    });
  });

  it('uploads a selected image to ImgBB before saving the product', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ success: true, data: { url: 'https://i.ibb.co/uploaded.jpg' } }),
    });
    vi.stubGlobal('fetch', fetchMock);
    vi.mocked(addDoc).mockResolvedValueOnce({} as any);
    const service = TestBed.inject(XicaDataService);

    await service.salvarProduto(
      { id: '', nome: 'Prato', descricao: 'Desc', preco: 20, imagem: '' },
      new File(['img'], 'prato.png', { type: 'image/png' }),
      false
    );

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('api.imgbb.com/1/upload'),
      expect.objectContaining({ method: 'POST' })
    );
    expect(addDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ imagem: 'https://i.ibb.co/uploaded.jpg' })
    );
  });

  it('updates an existing product in Firestore', async () => {
    vi.mocked(updateDoc).mockResolvedValueOnce(undefined);
    const service = TestBed.inject(XicaDataService);

    await service.salvarProduto(
      { id: '1', nome: 'Editado', descricao: 'Nova desc', preco: 30, imagem: 'https://img.com/editado.jpg' },
      null,
      true
    );

    expect(doc).toHaveBeenCalledWith(expect.anything(), 'cardapio', '1');
    expect(updateDoc).toHaveBeenCalledWith(expect.anything(), {
      nome: 'Editado',
      descricao: 'Nova desc',
      preco: 30,
      imagem: 'https://img.com/editado.jpg',
    });
  });

  it('deletes a product from the menu', async () => {
    vi.mocked(deleteDoc).mockResolvedValueOnce(undefined);
    const service = TestBed.inject(XicaDataService);

    await service.excluirProduto('1');

    expect(doc).toHaveBeenCalledWith(expect.anything(), 'cardapio', '1');
    expect(deleteDoc).toHaveBeenCalled();
  });
});
