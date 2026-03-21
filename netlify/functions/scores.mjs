import { neon } from '@neondatabase/serverless';

export default async (req, context) => {
    const sql = neon(process.env.NETLIFY_DATABASE_URL);

    // 1. MENGAMBIL DATA PAPAN SKOR
    if (req.method === 'GET') {
        try {
            await sql`
                CREATE TABLE IF NOT EXISTS leaderboard (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(50),
                    avatar VARCHAR(50),
                    score INT,
                    rank VARCHAR(50),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `;
            const result = await sql`SELECT * FROM leaderboard ORDER BY score DESC, created_at ASC LIMIT 10`;
            return new Response(JSON.stringify(result), { status: 200, headers: { 'Content-Type': 'application/json' } });
        } catch (error) {
            return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }
    }

    // 2. MENYIMPAN SKOR BARU (DENGAN FIX BUG PERCOBAAN PERTAMA)
    if (req.method === 'POST') {
        try {
            // Pastikan tabel dibuat jika belum ada sebelum menyimpan skor
            await sql`
                CREATE TABLE IF NOT EXISTS leaderboard (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(50),
                    avatar VARCHAR(50),
                    score INT,
                    rank VARCHAR(50),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `;
            const data = await req.json();
            await sql`
                INSERT INTO leaderboard (name, avatar, score, rank) 
                VALUES (${data.name}, ${data.avatar}, ${data.score}, ${data.rank})
            `;
            return new Response(JSON.stringify({ success: true }), { status: 200 });
        } catch (error) {
            return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }
    }

    // 3. FITUR RAHASIA: RESET PAPAN SKOR (Password: 19AG)
    if (req.method === 'DELETE') {
        try {
            const data = await req.json();
            if (data.password === '19AG') {
                await sql`DROP TABLE IF EXISTS leaderboard`; 
                return new Response(JSON.stringify({ success: true, message: "Papan skor berhasil direset!" }), { status: 200 });
            } else {
                return new Response(JSON.stringify({ error: "Password Salah!" }), { status: 401 });
            }
        } catch (error) {
            return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }
    }

    return new Response('Metode Tidak Diizinkan', { status: 405 });
};
