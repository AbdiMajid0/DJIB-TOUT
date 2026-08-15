package com.djibtout.backend.service.payment;

/**
 * Issue de l'amorce d'un paiement.
 *
 * REDIRECTION n'est pas un detail d'implementation : une carte bancaire impose
 * de quitter le site (3-D Secure) et c'est la notification serveur a serveur du
 * prestataire qui fait foi, jamais le retour du navigateur. Modeliser ce cas des
 * maintenant evite de refaire le parcours de paiement le jour ou la carte
 * arrive.
 */
public enum PaymentOutcome { ACCEPTE, REFUSE, REDIRECTION }
