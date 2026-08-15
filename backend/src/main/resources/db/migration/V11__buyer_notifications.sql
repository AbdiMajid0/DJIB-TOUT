-- Notifications destinees a l'acheteur : commandes, paiements et retours.
-- Table distincte de celle des vendeurs, dont la colonne porte `seller_id`.
CREATE TABLE IF NOT EXISTS buyer_notifications (
  id bigserial PRIMARY KEY,
  user_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title varchar(120) NOT NULL,
  message varchar(1000),
  link varchar(255),
  read boolean NOT NULL DEFAULT false,
  created_at timestamp NOT NULL DEFAULT now()
);

-- La liste est toujours lue par destinataire, du plus recent au plus ancien.
CREATE INDEX IF NOT EXISTS idx_buyer_notifications_user
  ON buyer_notifications (user_id, created_at DESC);
