ALTER TABLE seller_stores ADD COLUMN IF NOT EXISTS contact_email varchar(120);
ALTER TABLE seller_stores ADD COLUMN IF NOT EXISTS whatsapp_number varchar(30);
ALTER TABLE seller_stores ADD COLUMN IF NOT EXISTS opening_hours varchar(1000);
ALTER TABLE seller_stores ADD COLUMN IF NOT EXISTS delivery_policy varchar(2000);
ALTER TABLE seller_stores ADD COLUMN IF NOT EXISTS return_policy varchar(2000);
