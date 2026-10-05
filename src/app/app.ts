import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Firestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from '@angular/fire/firestore';
import { Auth, signInWithEmailAndPassword, signOut, authState, sendPasswordResetEmail } from '@angular/fire/auth';

interface Produto {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  imagem?: string;
}

interface ItemCarrinho {
  produto: Produto;
  quantidade: number;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  produtos: Produto[] = [];
  carrinho: ItemCarrinho[] = [];
  mostrarAvisoCookies: boolean = false;
  
  // Injeções do Firebase
  private firestore: Firestore = inject(Firestore);
  private auth: Auth = inject(Auth);
  
  // Variáveis de Estado do Painel de Administração
  modoAdmin: boolean = false;
  usuarioAutenticado: boolean = false;
  credenciais = { email: '', senha: '' };
  produtoForm: Produto = { id: '', nome: '', descricao: '', preco: 0, imagem: '' };
  editando: boolean = false;

  // Variáveis para upload de imagem
  arquivoSelecionado: File | null = null;
  aCarregarImagem: boolean = false;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.verificarConsentimentoCookies();
    this.carregarCardapio();
    this.carregarCarrinho();

    // Observa silenciosamente se o administrador está logado ou não
    authState(this.auth).subscribe(user => {
      this.usuarioAutenticado = !!user;
      this.cdr.detectChanges();
    });
  }

  // =========================================
  //   LÓGICA DE ADMINISTRAÇÃO E CRUD
  // =========================================

  abrirPainelAdmin() {
    this.modoAdmin = !this.modoAdmin;
    if (this.modoAdmin) window.scrollTo(0, 0); // Sobe para o topo ao abrir o painel
  }

  async fazerLogin() {
    if (!this.credenciais.email || !this.credenciais.senha) return;
    try {
      await signInWithEmailAndPassword(this.auth, this.credenciais.email, this.credenciais.senha);
      this.credenciais = { email: '', senha: '' }; 
    } catch (erro: any) {
      console.error(erro);
      alert('Acesso Negado (Código: ' + erro.code + ')');
    }
  }

  async recuperarSenha() {
    if (!this.credenciais.email) {
      alert('Por favor, digite o seu e-mail no campo acima e clique em "Esqueci a Senha".');
      return;
    }
    try {
      await sendPasswordResetEmail(this.auth, this.credenciais.email);
      alert('E-mail de recuperação enviado! Verifique a sua caixa de entrada.');
    } catch (erro: any) {
      console.error(erro);
      alert('Erro ao enviar (Código: ' + erro.code + ')');
    }
  }

  async fazerLogout() {
    await signOut(this.auth);
    this.modoAdmin = false;
  }

  selecionarImagem(event: any) {
    if (event.target.files && event.target.files[0]) {
      this.arquivoSelecionado = event.target.files[0];
    }
  }

  async salvarProduto() {
    this.aCarregarImagem = true;
    try {
      let urlImagem = this.produtoForm.imagem || '';

      // Upload para o ImgBB caso uma nova imagem seja selecionada
      if (this.arquivoSelecionado) {
        const formData = new FormData();
        formData.append('image', this.arquivoSelecionado);
        
        const imgbbApiKey = 'b3f31f9199de6a761c8e77b15ee1dbfd'; 
        
        const resposta = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbApiKey}`, {
          method: 'POST',
          body: formData
        });
        
        const dadosImgbb = await resposta.json();
        
        if (dadosImgbb.success) {
          urlImagem = dadosImgbb.data.url;
        } else {
          throw new Error('Falha no servidor de imagens.');
        }
      }

      const dadosLimpos = {
        nome: this.produtoForm.nome,
        descricao: this.produtoForm.descricao,
        preco: this.produtoForm.preco,
        imagem: urlImagem
      };

      if (this.editando) {
        const docRef = doc(this.firestore, 'cardapio', this.produtoForm.id);
        await updateDoc(docRef, dadosLimpos);
      } else {
        const cardapioRef = collection(this.firestore, 'cardapio');
        await addDoc(cardapioRef, dadosLimpos);
      }
      
      this.cancelarEdicao();
      await this.carregarCardapio();
    } catch (erro) {
      console.error("Erro ao salvar:", erro);
      alert('Ocorreu um erro ao salvar o prato. Verifique a sua ligação.');
    } finally {
      this.aCarregarImagem = false;
    }
  }

  editarProduto(produto: Produto) {
    this.editando = true;
    this.produtoForm = { ...produto }; 
    window.scrollTo(0, 0);
  }

  async excluirProduto(id: string) {
    if (confirm('Tem a certeza absoluta de que deseja excluir este prato do menu?')) {
      try {
        const docRef = doc(this.firestore, 'cardapio', id);
        await deleteDoc(docRef);
        await this.carregarCardapio();
      } catch (erro) {
        alert('Erro ao tentar excluir.');
      }
    }
  }

  cancelarEdicao() {
    this.editando = false;
    this.produtoForm = { id: '', nome: '', descricao: '', preco: 0, imagem: '' };
    this.arquivoSelecionado = null;
  }

  // =========================================
  //   LÓGICA DE COOKIES E CARRINHO
  // =========================================

  verificarConsentimentoCookies() {
    const consentimento = localStorage.getItem('xicas_cookies_aceites');
    if (!consentimento) this.mostrarAvisoCookies = true;
  }

  aceitarCookies() {
    localStorage.setItem('xicas_cookies_aceites', 'true');
    this.mostrarAvisoCookies = false;
  }

  obterDataAtual(): string {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
  }

  salvarCarrinho() {
    const estadoCarrinho = { data: this.obterDataAtual(), itens: this.carrinho };
    localStorage.setItem('xicas_carrinho_diario', JSON.stringify(estadoCarrinho));
  }

  carregarCarrinho() {
    const dadosGuardados = localStorage.getItem('xicas_carrinho_diario');
    if (dadosGuardados) {
      const estadoCarrinho = JSON.parse(dadosGuardados);
      if (estadoCarrinho.data === this.obterDataAtual()) {
        this.carrinho = estadoCarrinho.itens;
      } else {
        localStorage.removeItem('xicas_carrinho_diario');
        this.carrinho = [];
      }
    }
  }

  async carregarCardapio() {
    try {
      const cardapioRef = collection(this.firestore, 'cardapio');
      const querySnapshot = await getDocs(cardapioRef);
      
      this.produtos = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id, 
          nome: data['nome'],
          descricao: data['descricao'],
          preco: data['preco'],
          imagem: data['imagem']
        } as Produto;
      });
      this.cdr.detectChanges();
    } catch (erro) {
      console.error('Erro ao conectar com o banco de dados:', erro);
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
    this.salvarCarrinho();
  }

  removerDoCarrinho(produtoId: string) {
    const index = this.carrinho.findIndex(item => item.produto.id === produtoId);
    if (index !== -1) {
      if (this.carrinho[index].quantidade > 1) {
        this.carrinho[index].quantidade--;
      } else {
        this.carrinho.splice(index, 1);
      }
      this.salvarCarrinho();
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
    
    this.carrinho = [];
    this.salvarCarrinho();
    window.open(url, '_blank');
  }
}