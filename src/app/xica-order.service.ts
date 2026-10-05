import { Injectable, inject } from '@angular/core';
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
import { ItemCarrinho } from './cart.service';

@Injectable({ providedIn: 'root' })
export class XicaOrderService {
  private readonly firestore = inject(Firestore);

  async carregarPedidosAdmin(): Promise<any[]> {
    const pedidosQuery = query(collection(this.firestore, 'pedidos'), orderBy('criadoEm', 'desc'));
    const querySnapshot = await getDocs(pedidosQuery);
    return querySnapshot.docs.map(pedido => ({ id: pedido.id, ...pedido.data() }));
  }

  async atualizarStatusPedido(pedidoId: string, novoStatus: string): Promise<void> {
    const pedidoRef = doc(this.firestore, 'pedidos', pedidoId);
    await updateDoc(pedidoRef, { status: novoStatus });
  }

  gerarCodigoPedidoOffline(): string {
    const hoje = new Date();
    const ano = hoje.getFullYear().toString().slice(2);
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    const hora = String(hoje.getHours()).padStart(2, '0');
    const min = String(hoje.getMinutes()).padStart(2, '0');
    const dataHora = `${ano}${mes}${dia}-${hora}${min}`;
    const fallbackSeq = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${dataHora}-F${fallbackSeq}`;
  }

  async gerarCodigoPedido(): Promise<string> {
    const hoje = new Date();
    const ano = hoje.getFullYear().toString().slice(2);
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    const hora = String(hoje.getHours()).padStart(2, '0');
    const min = String(hoje.getMinutes()).padStart(2, '0');
    const dataHora = `${ano}${mes}${dia}-${hora}${min}`;

    if (typeof runTransaction !== 'function') {
      return this.gerarCodigoPedidoOffline();
    }

    const mesAtual = `${hoje.getFullYear()}-${mes}`;
    const contadorRef = doc(this.firestore, 'sistema', 'contador_pedidos');

    try {
      const sequencial = await runTransaction(this.firestore, async transaction => {
        const docSnap = await transaction.get(contadorRef);
        let novoSeq = 1;

        if (docSnap.exists()) {
          const dados = docSnap.data();
          if (dados['mes'] === mesAtual) {
            novoSeq = (dados['sequencia'] || 0) + 1;
          }
        }

        transaction.set(contadorRef, { mes: mesAtual, sequencia: novoSeq });
        return novoSeq;
      });

      if (typeof sequencial !== 'number' || !Number.isFinite(sequencial)) {
        return this.gerarCodigoPedidoOffline();
      }

      const seqFormatado = String(sequencial).padStart(3, '0');
      return `${dataHora}-${seqFormatado}`;
    } catch (erro) {
      console.error('Erro ao gerar sequencial no banco, gerando código offline:', erro);
      return this.gerarCodigoPedidoOffline();
    }
  }

  async salvarPedido(carrinho: ItemCarrinho[], total: number): Promise<void> {
    const pedidoRef = collection(this.firestore, 'pedidos');
    await addDoc(pedidoRef, {
      codigo: await this.gerarCodigoPedido(),
      itens: carrinho,
      total,
      status: 'pendente',
      criadoEm: new Date().toISOString(),
    });
  }
}
