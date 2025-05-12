# KML Viewer - Next.js Application

## Descrição

Este é um visualizador de arquivos KML desenvolvido com Next.js. Ele permite que os usuários carreguem e visualizem arquivos KML, fornecendo uma interface amigável e responsiva. O projeto utiliza Tailwind CSS para estilização e inclui componentes reutilizáveis para facilitar a manutenção e expansão.

## Funcionalidades

- Visualização de arquivos KML.
- Painel de informações detalhadas sobre os elementos KML.
- Interface responsiva para dispositivos móveis e desktop.
- Componentes reutilizáveis e bem estruturados.

## Tecnologias Utilizadas

- [Next.js](https://nextjs.org/): Framework React para renderização do lado do servidor e geração de sites estáticos.
- [Tailwind CSS](https://tailwindcss.com/): Framework de utilitários CSS para estilização.
- [TypeScript](https://www.typescriptlang.org/): Superset do JavaScript que adiciona tipagem estática.

## Estrutura do Projeto

```plaintext
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── viewer/
│       └── page.tsx
├── components/
│   ├── file-info-panel.tsx
│   ├── kml-element-details.tsx
│   ├── kml-elements-list.tsx
│   ├── kml-viewer.tsx
│   ├── mobile-header.tsx
│   ├── theme-provider.tsx
│   └── ui/
│       ├── ... (vários componentes reutilizáveis)
├── hooks/
│   ├── use-mobile.tsx
│   └── use-toast.ts
├── lib/
│   ├── kml-parser.ts
│   ├── kmz-parser.ts
│   ├── types.ts
│   └── utils.ts
├── public/
│   ├── placeholder-logo.png
│   ├── placeholder-user.jpg
│   └── ... (outros arquivos de mídia)
├── styles/
│   └── globals.css
├── package.json
└── README.md
```

## Instalação

1. Clone o repositório:

   ```bash
   git clone <URL_DO_REPOSITORIO>
   cd kml-viewer
   ```

2. Instale as dependências:

   ```bash
   pnpm install
   ```

3. Inicie o servidor de desenvolvimento:

   ```bash
   pnpm dev
   ```

4. Acesse a aplicação em [http://localhost:3000](http://localhost:3000).

## Scripts Disponíveis

- `pnpm dev`: Inicia o servidor de desenvolvimento.
- `pnpm build`: Cria a build de produção.
- `pnpm start`: Inicia o servidor em modo de produção.

## Contribuição

1. Faça um fork do projeto.
2. Crie uma branch para sua feature ou correção de bug:

   ```bash
   git checkout -b minha-feature
   ```

3. Faça commit das suas alterações:

   ```bash
   git commit -m "Adiciona minha nova feature"
   ```

4. Envie para o repositório remoto:

   ```bash
   git push origin minha-feature
   ```

5. Abra um Pull Request.

## Licença

Este projeto está licenciado sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.