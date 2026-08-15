package com.djibtout.backend.service.payment;

/**
 * Passerelle de paiement.
 *
 * Aucune implementation reelle n'existe encore : tant qu'aucun bean n'est
 * publie, /api/payments/process repond 503 plutot que d'accepter un paiement
 * fictif. C'est le comportement voulu — l'ancien code marquait toute commande
 * payee sans qu'aucun argent ne bouge.
 *
 * Pour brancher un prestataire (WaafiPay, acquereur bancaire), implementer
 * cette interface, publier le bean, et ajouter :
 *   - un endpoint de notification (webhook) verifiant la signature du
 *     prestataire, sans quoi n'importe qui peut declarer une commande payee ;
 *   - l'idempotence sur ce endpoint, les prestataires rejouant leurs
 *     notifications ;
 *   - le remboursement, aujourd'hui absent (ReturnStatus.REFUNDED est
 *     inatteignable).
 */
public interface PaymentGateway {

    /** Nom du prestataire, journalise et stocke avec le paiement. */
    String name();

    /**
     * Amorce le paiement. Une issue ACCEPTE engage la passerelle : l'appelant
     * peut considerer la commande comme reglee. REDIRECTION ne l'engage pas.
     */
    PaymentResult initiate(PaymentIntent intent);
}
