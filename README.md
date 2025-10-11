# 🏢 Sistema de Controle Fiscal

Sistema completo para controle de impostos, obrigações e parcelamentos fiscais com integração Supabase e recorrência automática.

## 🚀 Funcionalidades

### ✅ **Controle Completo**
- **Clientes**: MEI, Simples Nacional, Lucro Presumido, Lucro Real
- **Impostos**: ICMS, ISS, IRPJ, etc. com vencimentos automáticos
- **Obrigações**: SPED, DCTF, EFD com controle de status
- **Parcelamentos**: Controle de envio (pendente → em andamento → entregue)

### ✅ **Recorrência Automática**
- Gera novos itens no **dia 1º** de cada mês/trimestre
- Aplica regras de final de semana (antecipar/postergar/manter)
- Mantém histórico de geração

### ✅ **Calendário Integrado**
- Mostra **TODOS** os tipos juntos: 💰 Impostos, 📄 Obrigações, 📊 Parcelamentos
- Filtros por cliente, status e tipo
- Cores diferentes para cada tipo
- Detalhes completos ao clicar

### ✅ **APIs Completas**
- `/api/clients` - CRUD de clientes
- `/api/taxes` - CRUD de impostos  
- `/api/obligations` - CRUD de obrigações
- `/api/installments` - CRUD de parcelamentos
- `/api/recurrence/generate` - Geração de recorrências
- `/api/cron/generate-recurrence` - Cron job automático

## 🛠️ Tecnologias

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **Banco de Dados**: PostgreSQL (Supabase)
- **UI**: Radix UI, Lucide React
- **Formulários**: React Hook Form
- **Gráficos**: Recharts

## 📦 Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/jiji465/v0-fiscal-obligations-and-taxes.git
cd v0-fiscal-obligations-and-taxes
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env.local
```

Edite o `.env.local` com suas credenciais do Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=https://amfarsmjfmvnpbyseljy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_aqui
```

4. **Execute a migration do banco de dados**
- Acesse: https://amfarsmjfmvnpbyseljy.supabase.co
- Vá em: SQL Editor
- Cole o conteúdo do arquivo `supabase-migration.sql`
- Execute o SQL

5. **Inicie o servidor de desenvolvimento**
```bash
npm run dev
```

6. **Acesse a aplicação**
- URL: http://localhost:3000
- Página de teste: http://localhost:3000/teste

## 🗄️ Banco de Dados

### Tabelas Principais
- **clients**: Clientes com regime tributário
- **taxes**: Impostos com recorrência automática
- **obligations**: Obrigações fiscais
- **installments**: Parcelamentos
- **obligation_history**: Histórico de alterações

### Tipos de Dados
- **tax_regime**: MEI, Simples Nacional, Lucro Presumido, Lucro Real
- **weekend_rule**: Antecipar, Postergar, Manter
- **recurrence_type**: Mensal, Bimestral, Trimestral, Semestral, Anual
- **status**: Pendente, Em Andamento, Concluído, Atrasado
- **priority**: Baixa, Média, Alta, Urgente

## 📊 Como Usar

### 1. **Cadastrar Clientes**
- Acesse a página de clientes
- Preencha nome, CNPJ, email, telefone
- Selecione o regime tributário

### 2. **Criar Impostos**
- Defina nome, descrição, código federal
- Configure dia/mês de vencimento
- Escolha regra de final de semana
- Ative recorrência automática

### 3. **Gerenciar Obrigações**
- Crie obrigações (SPED, DCTF, etc.)
- Configure vencimentos e recorrência
- Acompanhe status: pendente → em andamento → concluído

### 4. **Controlar Parcelamentos**
- Cadastre parcelamentos de débitos
- Defina número de parcelas e valores
- Controle status de envio

### 5. **Visualizar Calendário**
- Veja todos os vencimentos em um calendário unificado
- Filtre por cliente, status ou tipo
- Clique nos dias para ver detalhes

### 6. **Gerar Recorrências**
- Use o botão "Gerar Recorrências" na página de teste
- Ou configure cron job automático para dia 1º de cada mês

## 🔧 Configuração Avançada

### Cron Job Automático
Para gerar recorrências automaticamente no dia 1º de cada mês:

1. Configure um serviço de cron (Vercel Cron, GitHub Actions, etc.)
2. Faça uma requisição GET para `/api/cron/generate-recurrence`
3. O sistema verificará se é dia 1º e gerará as recorrências

### Regras de Final de Semana
Cada item pode ter sua própria regra:
- **Antecipar**: Move vencimento para sexta-feira anterior
- **Postergar**: Move vencimento para segunda-feira seguinte
- **Manter**: Mantém a data original

### Recorrência Personalizada
Configure diferentes tipos de recorrência:
- **Mensal**: Todo mês
- **Bimestral**: A cada 2 meses
- **Trimestral**: A cada 3 meses
- **Semestral**: A cada 6 meses
- **Anual**: Todo ano
- **Personalizada**: Intervalo customizado

## 📱 Páginas Disponíveis

- **/** - Dashboard principal
- **/clientes** - Gestão de clientes
- **/impostos** - Controle de impostos
- **/obrigacoes** - Gestão de obrigações
- **/parcelamentos** - Controle de parcelamentos
- **/teste** - Página de teste com funcionalidades completas

## 🔒 Segurança

- **RLS (Row Level Security)** habilitado no Supabase
- **Políticas de acesso** configuradas para acesso público
- **Validação de dados** em todas as APIs
- **Tratamento de erros** robusto

## 📈 Estatísticas

O sistema fornece estatísticas em tempo real:
- Total de clientes ativos
- Impostos pendentes
- Obrigações em andamento
- Parcelamentos pendentes
- Próximos vencimentos
- Items atrasados

## 🐛 Solução de Problemas

### Erro de Conexão com Supabase
1. Verifique as credenciais no `.env.local`
2. Confirme se a migration foi executada
3. Teste a conexão no painel do Supabase

### Recorrências Não Gerando
1. Verifique se `auto_generate` está ativo
2. Confirme se é dia 1º do mês
3. Verifique logs no console

### Calendário Não Carregando
1. Verifique se as APIs estão funcionando
2. Confirme se há dados no banco
3. Teste a página `/teste`

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para suporte ou dúvidas:
- Abra uma issue no GitHub
- Consulte a documentação do Supabase
- Verifique os logs do console

---

**Desenvolvido com ❤️ para controle fiscal eficiente**