-- L'acheteur peut desormais retirer sa demande de retour tant que le vendeur
-- ne s'est pas prononce. La contrainte de controle posee par V1 n'acceptait que
-- les cinq statuts d'origine : sans cette mise a jour, l'annulation echoue en
-- violation de contrainte alors que le code applicatif la juge valide.
ALTER TABLE return_requests DROP CONSTRAINT IF EXISTS return_requests_status_check;

ALTER TABLE return_requests ADD CONSTRAINT return_requests_status_check
  CHECK (status IN ('REQUESTED', 'APPROVED', 'REJECTED', 'RECEIVED', 'REFUNDED', 'CANCELLED'));
