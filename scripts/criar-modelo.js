// Gera o modelo em branco: modelo/ordem-de-servico.pdf
import { mkdirSync, writeFileSync } from 'node:fs';
import { gerarModelo } from '../src/modelo.js';

mkdirSync('modelo', { recursive: true });
writeFileSync('modelo/ordem-de-servico.pdf', await gerarModelo());
console.log('Modelo criado: modelo/ordem-de-servico.pdf');
