package com.djibtout.backend.service.payment;

import java.math.BigDecimal;

/**
 * Demande de paiement transmise a la passerelle.
 *
 * `payerReference` est volontairement generique : numero de telephone pour le
 * mobile money, identifiant de session pour une carte. Aucune donnee de carte
 * ne transite jamais par ce type — les collecter imposerait une conformite
 * PCI-DSS que ce projet n'a pas.
 */
public record PaymentIntent(Long orderId, BigDecimal amount, String method,
                            String payerReference, String returnUrl) {}
