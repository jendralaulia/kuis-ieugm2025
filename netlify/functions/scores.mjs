import { neon } from '@neondatabase/serverless';

export default async (req, context) => {
    // Mengambil kunci rahasia dari Netlify Environment Variables
    const sql = neon(process.env.NETLIFY_DATABASE_URL);

    // 1. MENGAMBIL DATA PAPAN SKOR (Tabel Khusus UGM)
    if (req.method === 'GET') {
        try {
            await sql`
                CREATE TABLE IF NOT EXISTS leaderboard_ugm (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(50),
                    avatar VARCHAR(50),
                    score INT,
                    rank VARCHAR(50),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `;
            const result = await sql`SELECT * FROM leaderboard_ugm ORDER BY score DESC, created_at ASC LIMIT 10`;
            return new Response(JSON.stringify(result), { status: 200, headers: { 'Content-Type': 'application/json' } });
        } catch (error) {
            return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }
    }

    // 2. MENYIMPAN SKOR BARU (Tabel Khusus UGM)
    if (req.method === 'POST') {
        try {
            // Pastikan tabel dibuat jika belum ada sebelum menyimpan skor
            await sql`
                CREATE TABLE IF NOT EXISTS leaderboard_ugm (
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
                INSERT INTO leaderboard_ugm (name, avatar, score, rank) 
                VALUES (${data.name}, ${data.avatar}, ${data.score}, ${data.rank})
            `;
            return new Response(JSON.stringify({ success: true }), { status: 200 });
        } catch (error) {
            return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }
    }

    // 3. FITUR RAHASIA: RESET PAPAN SKOR (Password: UGM05)
    if (req.method === 'DELETE') {
        try {
            const data = await req.json();
            if (data.password === 'UGM05') { // Password Reset Khusus IE UGM
                // Menghapus tabel lama untuk mereset data
                await sql`DROP TABLE IF EXISTS leaderboard_ugm`; 
                return new Response(JSON.stringify({ success: true, message: "Papan skor UGM berhasil direset!" }), { status: 200 });
            } else {
                return new Response(JSON.stringify({ error: "Password Salah!" }), { status: 401 });
            }
        } catch (error) {
            return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }
    }

    return new Response('Metode Tidak Diizinkan', { status: 405 });
};
