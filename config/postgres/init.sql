-- Ortaklasa Postgres ilk başlatma scripti.
-- docker-entrypoint-initdb.d/ içine mount edilir; sadece volume boşken çalışır.

-- Kriptografi (UUID, hash, vb.)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Vektör arama (Ollama embedding'leri için ileride kullanışlı)
-- pgvector image'da yok; kullanmak istersen 'pgvector/pgvector:pg16' image'ına geç.
-- CREATE EXTENSION IF NOT EXISTS vector;

-- Veritabanı yorumu
COMMENT ON DATABASE ortaklasa IS 'Ortaklasa shared dev DB — Stage 5+';

-- (Gerçek tablolar uygulama kodu ile gelecek; bu dosya yalnızca alt yapıyı kurar.)
