ALTER TABLE seller_stores ADD COLUMN IF NOT EXISTS business_type varchar(255);
ALTER TABLE seller_stores ADD COLUMN IF NOT EXISTS phone varchar(255);
ALTER TABLE seller_stores ADD COLUMN IF NOT EXISTS business_address varchar(500);
ALTER TABLE seller_stores ADD COLUMN IF NOT EXISTS registration_number varchar(255);
ALTER TABLE seller_stores ADD COLUMN IF NOT EXISTS identity_document_url varchar(255);
ALTER TABLE seller_stores ADD COLUMN IF NOT EXISTS business_document_url varchar(255);
ALTER TABLE seller_stores ADD COLUMN IF NOT EXISTS terms_accepted boolean DEFAULT false;
ALTER TABLE seller_stores ADD COLUMN IF NOT EXISTS onboarding_submitted boolean DEFAULT false;
CREATE TABLE IF NOT EXISTS product_variant_images (variant_id bigint NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,image_url varchar(1000),display_order integer NOT NULL,PRIMARY KEY(variant_id,display_order));
