# claude-code-md-viewer-gbvdm

[English](README.md)

Um visualizador de Markdown para o [Claude Code](https://code.claude.com/docs/en/overview) que **renderiza os diagramas Mermaid**. A pré-visualização de `.md` do painel de arquivos do app Claude (aba Code) mostra os blocos ` ```mermaid ` como código; este plugin abre o mesmo arquivo no painel do navegador do app, com os diagramas renderizados.

O que a página mostra:

- o documento, com tabelas, blocos `<details>` e o HTML que o próprio `.md` tiver;
- cada bloco ` ```mermaid ` renderizado, em tema escuro, na largura da área de leitura (um clique no diagrama alterna para o tamanho natural, com rolagem horizontal);
- no lugar de um diagrama com erro de sintaxe, a mensagem do Mermaid com a linha e o motivo;
- à esquerda, a lista de pastas e arquivos `.md` da pasta do documento, para abrir outro arquivo com um clique;
- links entre documentos (`outro.md#secao`) que abrem o outro documento na seção certa, mesmo dentro de um `<details>` fechado;
- o arquivo de novo, sozinho, até 2 segundos depois de você salvar uma alteração;
- uma busca no documento, no campo amarelo do topo, que não diferencia maiúsculas nem acentos ("funcao" acha "função"), conta os resultados, abre os blocos `<details>` onde eles estão, marca na borda os blocos recolhidos que têm resultado e acha também o texto de dentro dos diagramas;
- um filtro da lista de arquivos;
- zoom do documento, que fica guardado para a próxima vez que a página abrir.

### Atalhos

| Tecla | O que faz |
|---|---|
| `Ctrl+F` ou `/` | vai para a busca no documento |
| `Enter` / `Shift+Enter` | próximo / anterior resultado da busca (também `F3` / `Shift+F3`) |
| `Esc` | limpa a busca ou o filtro |
| `Ctrl+P` | vai para o filtro da lista de arquivos; `Enter` abre o primeiro arquivo da lista filtrada |
| `Ctrl` + roda do mouse, `Ctrl +`, `Ctrl −` | aumenta e diminui o zoom do documento |
| `Ctrl+0` | volta o zoom para 100% (o botão com a porcentagem faz o mesmo) |

## Requisitos

- [Node.js](https://nodejs.org) 18 ou mais novo.
- O app Claude, aba Code, para abrir no painel do navegador. Em outros lugares (terminal, extensão de editor) o plugin devolve um endereço para abrir no navegador.
- Internet: a página carrega as bibliotecas `marked`, `DOMPurify` e `mermaid` de `cdn.jsdelivr.net`. O conteúdo dos seus arquivos não é enviado para lugar nenhum.

## Instalação

No terminal, com o comando `claude` do Claude Code:

```bash
claude plugin marketplace add guilhermebvdm/claude-code-md-viewer-gbvdm
```

```bash
claude plugin install md-viewer@gbvdm-md-viewer
```

Depois abra uma sessão nova no app.

## Como usar

### 1. Abrir um arquivo numa sessão

Peça ao Claude, com o caminho ou só parte do nome:

```text
/md-viewer:view docs/specs/05-fluxos-e-payloads.md
```

ou em texto livre: "abre o 05-fluxos-e-payloads.md no visualizador". Sem caminho (`/md-viewer:view`), a página abre na pasta da sessão, com a lista de arquivos.

O Claude roda um comando que inicia o servidor do visualizador, se ele ainda não estiver rodando, e abre o painel do navegador no arquivo.

### 2. Depois de aberto, sem pedir ao Claude

- clique em outro `.md` ou pasta na lista à esquerda ("Lista" esconde e mostra a lista);
- clique nos links do documento;
- digite outro caminho no campo do topo, de arquivo `.md` ou de pasta, e tecle Enter;
- edite o arquivo no editor que quiser: a página recarrega sozinha.

### 3. Partindo do painel de arquivos do app

O app não permite acrescentar opções ao menu do botão direito do painel de arquivos, então não há um "Abrir com md-viewer" ali. O caminho mais curto:

1. botão direito no arquivo, **Copy path**;
2. no campo de mensagem: `/md-viewer:view ` e cole o caminho.

Se o visualizador já estiver aberto no painel do navegador, cole o caminho no campo do topo da página: não precisa passar pelo Claude.

### Sem o Claude

Com uma cópia deste repositório:

```bash
node server/serve.js --ensure "C:\caminho\do\arquivo.md"
```

O comando escreve o endereço da página; abra no navegador que quiser.

## O servidor

- Fica em `http://localhost:4317`. Para usar outra porta, defina a variável de ambiente `MD_VIEWER_PORT`.
- Continua rodando depois que a sessão termina, e a próxima sessão usa o mesmo. Para parar: `node server/serve.js --stop`, ou peça ao Claude para parar o visualizador.
- Quando o plugin é atualizado, o próximo `--ensure` para o servidor da versão antiga e inicia o da nova.

## O que o servidor acessa

Leia antes de instalar: é código que roda com as suas permissões.

- **Lê** arquivos `.md` e imagens (`.png`, `.jpg`, `.gif`, `.webp`, `.svg`) e **lista** pastas, em qualquer pasta do computador que a página pedir. Pastas que começam com `.` e `node_modules` ficam fora da lista.
- **Não grava** nada em disco.
- **Só aceita conexões da própria máquina** (`127.0.0.1`) e só responde a pedidos endereçados a `localhost`, o que bloqueia uma página de outro site que tente chegar ao servidor por outro nome.
- O HTML de cada documento passa pelo DOMPurify antes de aparecer, o que remove scripts e atributos como `onerror` de um `.md` de origem desconhecida.

## Limites conhecidos

- Diagrama muito largo, ao caber na largura, fica com letra pequena: clique nele para ver no tamanho natural.
- Diagrama pequeno cresce até 1,5 vez o tamanho natural, e não ocupa a largura toda.
- Sem internet, os diagramas não aparecem.
- Arquivos que não são `.md` não abrem.
- A busca não acha um trecho que muda de formatação no meio (parte em negrito, parte não).

## Licença

[MIT](LICENSE)
