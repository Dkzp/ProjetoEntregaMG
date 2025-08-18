// Importa o cliente Supabase e o dotenv para garantir que as variáveis de ambiente sejam carregadas
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase, lendo as variáveis de ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Verifica se as credenciais foram fornecidas no .env
if (!supabaseUrl || !supabaseKey) {
    throw new Error("As variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY são obrigatórias.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Funções que imitam o comportamento do SQLite para não precisar mudar o server.js
const db = {
    /**
     * Função para buscar um único registro (equivalente ao db.get do SQLite).
     * Suporta queries simples como "SELECT * FROM tabela WHERE coluna = ?"
     */
    getAsync: async (query, params) => {
        // Para SELECT simples
        if (query.toUpperCase().startsWith('SELECT')) {
            const tableMatch = query.match(/FROM\s+(\w+)/i);
            const whereMatch = query.match(/WHERE\s+(.+?)\s*=\s*\?/i);

            if (tableMatch && whereMatch) {
                const table = tableMatch[1];
                const whereClause = whereMatch[1].trim();
                const value = params[0];

                // Monta a consulta com o Supabase
                const { data, error } = await supabase
                    .from(table)
                    .select('*')
                    .eq(whereClause, value)
                    .maybeSingle(); // Retorna um único objeto ou null

                if (error) {
                    console.error("Erro na consulta ao Supabase (getAsync):", error.message);
                    throw error;
                }
                return data;
            }
        }
        console.error('Query não suportada no adaptador Supabase (getAsync):', query);
        throw new Error('Query não suportada no adaptador Supabase');
    },

    /**
     * Função para executar uma ação, como INSERT (equivalente ao db.run do SQLite).
     * Suporta queries como "INSERT INTO tabela (col1, col2) VALUES (?, ?)"
     */
    runAsync: async (query, params) => {
        // Para INSERT
        if (query.toUpperCase().startsWith('INSERT')) {
            const tableMatch = query.match(/INTO\s+(\w+)/i);
            const columnsMatch = query.match(/\((.+?)\)/);
            
            if (tableMatch && columnsMatch) {
                const table = tableMatch[1];
                const columns = columnsMatch[1].split(',').map(c => c.trim());
                
                // Cria o objeto para inserir no Supabase
                const record = {};
                columns.forEach((col, index) => {
                    record[col] = params[index];
                });
                
                const { data, error } = await supabase
                    .from(table)
                    .insert(record)
                    .select(); // O .select() retorna o registro inserido
                
                if (error) {
                    console.error("Erro na consulta ao Supabase (runAsync):", error.message);
                    throw error;
                }
                // O SQLite 'run' não retorna os dados, mas com Supabase podemos retornar
                return data; 
            }
        }
        console.error('Query não suportada no adaptador Supabase (runAsync):', query);
        throw new Error('Query não suportada no adaptador Supabase');
    }
};

module.exports = db;