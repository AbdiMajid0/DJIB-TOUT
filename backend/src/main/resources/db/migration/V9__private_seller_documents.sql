CREATE TABLE IF NOT EXISTS seller_documents (
 id bigserial PRIMARY KEY,
 store_id bigint NOT NULL REFERENCES seller_stores(id) ON DELETE CASCADE,
 document_type varchar(40) NOT NULL,
 file_name varchar(255) NOT NULL,
 content_type varchar(100) NOT NULL,
 content bytea NOT NULL,
 created_at timestamp DEFAULT now()
);
