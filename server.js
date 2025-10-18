require('dotenv').config();
const express = require('express');
const { ApolloServer, gql } = require('apollo-server-express');
const Blockchain = require('./blockchain/Blockchain');
const fs = require('fs');
const { votaciones } = require('./votaciones');

const app = express();
const PORT = process.env.PORT || 4000;
const BLOCKCHAIN_FILE = process.env.BLOCKCHAIN_FILE || 'blockchain.json';

let blockchain = new Blockchain();

if (fs.existsSync(BLOCKCHAIN_FILE)) {
  const data = JSON.parse(fs.readFileSync(BLOCKCHAIN_FILE));
  blockchain.chain = data.map(b => ({
    ...b,
    hash: b.hash,
    previousHash: b.previousHash
  }));
} else {
  blockchain.createGenesisBlock();
  fs.writeFileSync(BLOCKCHAIN_FILE, JSON.stringify(blockchain.chain, null, 2));
}

function saveBlockchain() {
  fs.writeFileSync(BLOCKCHAIN_FILE, JSON.stringify(blockchain.chain, null, 2));
}

function mineBlock(data) {
  return blockchain.addBlock(data);
}

const typeDefs = gql`
  type Block {
    index: Int
    timestamp: String
    data: Voto
    previousHash: String
    hash: String
  }

  type Voto {
    votacionId: Int
    usuario: String
    opcion: String
  }

  type Votacion {
    id: Int
    titulo: String
    opciones: [String]
  }

  type Query {
    getChain: [Block]
    getVotaciones: [Votacion]
  }

  type Mutation {
    crearVoto(votacionId: Int!, usuario: String!, opcion: String!): Block
  }
`;

const resolvers = {
  Query: {
    getChain: () => blockchain.chain,
    getVotaciones: () => votaciones
  },
   Mutation: {
  crearVoto: (_, { votacionId, usuario, opcion }) => {
    const votacion = votaciones.find(v => v.id === votacionId);
    if (!votacion) throw new Error("Votación no existe");
    if (!votacion.opciones.includes(opcion)) throw new Error("Opción inválida");

    const votoExistente = blockchain.chain.find(
      block => block.data.votacionId === votacionId && block.data.usuario === usuario
    );
    if (votoExistente) throw new Error("Este usuario ya votó en esta votación");

    const newBlock = mineBlock({ votacionId, usuario, opcion });
    saveBlockchain();
    return newBlock;
  }
}

};

async function startServer() {
  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();
  server.applyMiddleware({ app, path: '/graphql' });

  app.listen(PORT, () => console.log(`Servidor backend corriendo en http://localhost:${PORT}/graphql`));
}

startServer();
