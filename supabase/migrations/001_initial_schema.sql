-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE tax_regime AS ENUM ('simples_nacional', 'lucro_presumido', 'lucro_real', 'mei');
CREATE TYPE weekend_rule AS ENUM ('anticipate', 'postpone', 'keep');
CREATE TYPE recurrence_type AS ENUM ('monthly', 'bimonthly', 'quarterly', 'semiannual', 'annual', 'custom');
CREATE TYPE frequency AS ENUM ('monthly', 'quarterly', 'annual', 'custom');
CREATE TYPE priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE status AS ENUM ('pending', 'in_progress', 'completed', 'overdue');
CREATE TYPE obligation_category AS ENUM ('sped', 'tax_guide', 'certificate', 'declaration', 'other');

-- Create clients table
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) UNIQUE NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    tax_regime tax_regime NOT NULL DEFAULT 'simples_nacional',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create taxes table
CREATE TABLE taxes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    federal_tax_code VARCHAR(50),
    due_day INTEGER CHECK (due_day >= 1 AND due_day <= 31),
    due_month INTEGER CHECK (due_month >= 1 AND due_month <= 12),
    frequency frequency NOT NULL DEFAULT 'monthly',
    recurrence_type recurrence_type NOT NULL DEFAULT 'monthly',
    recurrence_interval INTEGER DEFAULT 1,
    recurrence_end_date DATE,
    auto_generate BOOLEAN DEFAULT false,
    weekend_rule weekend_rule NOT NULL DEFAULT 'postpone',
    amount DECIMAL(10,2),
    status status NOT NULL DEFAULT 'pending',
    priority priority NOT NULL DEFAULT 'medium',
    assigned_to VARCHAR(255),
    protocol VARCHAR(100),
    realization_date DATE,
    notes TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    completed_by VARCHAR(255),
    parent_tax_id UUID REFERENCES taxes(id) ON DELETE CASCADE,
    generated_for VARCHAR(7), -- Format: YYYY-MM
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create obligations table
CREATE TABLE obligations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    tax_id UUID REFERENCES taxes(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category obligation_category NOT NULL DEFAULT 'other',
    due_day INTEGER NOT NULL CHECK (due_day >= 1 AND due_day <= 31),
    due_month INTEGER CHECK (due_month >= 1 AND due_month <= 12),
    frequency frequency NOT NULL DEFAULT 'monthly',
    recurrence_type recurrence_type NOT NULL DEFAULT 'monthly',
    recurrence_interval INTEGER DEFAULT 1,
    recurrence_end_date DATE,
    auto_generate BOOLEAN DEFAULT false,
    weekend_rule weekend_rule NOT NULL DEFAULT 'postpone',
    status status NOT NULL DEFAULT 'pending',
    priority priority NOT NULL DEFAULT 'medium',
    assigned_to VARCHAR(255),
    protocol VARCHAR(100),
    realization_date DATE,
    amount DECIMAL(10,2),
    notes TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    completed_by VARCHAR(255),
    parent_obligation_id UUID REFERENCES obligations(id) ON DELETE CASCADE,
    generated_for VARCHAR(7), -- Format: YYYY-MM
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create installments table
CREATE TABLE installments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    installment_number INTEGER NOT NULL CHECK (installment_number >= 1),
    total_installments INTEGER NOT NULL CHECK (total_installments >= 1),
    due_date DATE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status status NOT NULL DEFAULT 'pending',
    frequency frequency NOT NULL DEFAULT 'monthly',
    recurrence_type recurrence_type NOT NULL DEFAULT 'monthly',
    recurrence_interval INTEGER DEFAULT 1,
    recurrence_end_date DATE,
    auto_generate BOOLEAN DEFAULT false,
    weekend_rule weekend_rule NOT NULL DEFAULT 'postpone',
    parent_installment_id UUID REFERENCES installments(id) ON DELETE CASCADE,
    generated_for VARCHAR(7), -- Format: YYYY-MM
    notes TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    completed_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create obligation_history table
CREATE TABLE obligation_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    obligation_id UUID REFERENCES obligations(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_name VARCHAR(255)
);

-- Create indexes for better performance
CREATE INDEX idx_clients_cnpj ON clients(cnpj);
CREATE INDEX idx_clients_tax_regime ON clients(tax_regime);
CREATE INDEX idx_taxes_client_id ON taxes(client_id);
CREATE INDEX idx_taxes_due_date ON taxes(due_day, due_month);
CREATE INDEX idx_obligations_client_id ON obligations(client_id);
CREATE INDEX idx_obligations_due_date ON obligations(due_day, due_month);
CREATE INDEX idx_obligations_status ON obligations(status);
CREATE INDEX idx_installments_client_id ON installments(client_id);
CREATE INDEX idx_installments_due_date ON installments(due_date);
CREATE INDEX idx_installments_status ON installments(status);

-- Enable Row Level Security (RLS)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE taxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE obligations ENABLE ROW LEVEL SECURITY;
ALTER TABLE installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE obligation_history ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed for your security requirements)
CREATE POLICY "Enable all operations for all users" ON clients FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON taxes FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON obligations FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON installments FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON obligation_history FOR ALL USING (true);
