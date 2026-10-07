export const environment = {
  production: false,

  // 1. Dados do Cliente (Troque apenas aqui para cada novo negócio)
  cliente: {
    nome: "Xica's Gastronomia",
    whatsapp: "55489999999xx", // Coloque o número do WhatsApp com DDD e sem espaços ou traços
    mensagemPadrao: "Gostaria de fazer o seguinte pedido para retirada no Food Truck:"
  },

  firebaseConfig: {
    apiKey: 'AIzaSyDl9o3OMnsX3vULGMgVZcSMdUUrDbALEZE',
    authDomain: 'xica-gastronomia.firebaseapp.com',
    projectId: 'xica-gastronomia',
    storageBucket: 'xica-gastronomia.firebasestorage.app',
    messagingSenderId: '789904563868',
    appId: '1:789904563868:web:779fbd2c4aad26daa75759',
    measurementId: 'G-KRV4J12GVM',
  },
  imgbbApiKey: 'b3f31f9199de6a761c8e77b15ee1dbfd',
};
