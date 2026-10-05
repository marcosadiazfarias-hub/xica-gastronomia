import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from '@angular/fire/firestore';
import { environment } from '../environments/environment';

export interface Produto {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  imagem?: string;
}

@Injectable({ providedIn: 'root' })
export class XicaDataService {
  private readonly firestore = inject(Firestore);
  private readonly imgBbApiKey = environment.imgbbApiKey;

  async carregarCardapio(): Promise<Produto[]> {
    const cardapioRef = collection(this.firestore, 'cardapio');
    const snapshot = await getDocs(cardapioRef);

    return snapshot.docs.map(item => {
      const dados = item.data();
      return {
        id: item.id,
        nome: dados['nome'],
        descricao: dados['descricao'],
        preco: dados['preco'],
        imagem: dados['imagem'],
      } as Produto;
    });
  }

  async salvarProduto(produto: Produto, arquivoSelecionado: File | null, editando: boolean): Promise<void> {
    let urlImagem = produto.imagem || '';

    if (arquivoSelecionado) {
      const formData = new FormData();
      formData.append('image', arquivoSelecionado);

      const resposta = await fetch(`https://api.imgbb.com/1/upload?key=${this.imgBbApiKey}`, {
        method: 'POST',
        body: formData,
      });

      const dadosImgbb = await resposta.json();
      if (!dadosImgbb.success) {
        throw new Error('Falha no servidor de imagens.');
      }

      urlImagem = dadosImgbb.data.url;
    }

    const dadosLimpos = {
      nome: produto.nome,
      descricao: produto.descricao,
      preco: produto.preco,
      imagem: urlImagem,
    };

    if (editando) {
      const docRef = doc(this.firestore, 'cardapio', produto.id);
      await updateDoc(docRef, dadosLimpos);
      return;
    }

    const cardapioRef = collection(this.firestore, 'cardapio');
    await addDoc(cardapioRef, dadosLimpos);
  }

  async excluirProduto(id: string): Promise<void> {
    const docRef = doc(this.firestore, 'cardapio', id);
    await deleteDoc(docRef);
  }

}
