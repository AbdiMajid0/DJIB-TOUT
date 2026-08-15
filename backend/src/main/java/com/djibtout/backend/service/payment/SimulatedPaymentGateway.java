package com.djibtout.backend.service.payment;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.util.Locale;
import java.util.UUID;

/**
 * Passerelle factice, reservee au developpement et aux tests.
 *
 * Publiee uniquement si app.payments.simulated=true, valeur absente des profils
 * prod et staging. Sans elle, aucun bean PaymentGateway n'existe et le paiement
 * est refuse : c'est ce qui empeche desormais une mise en production d'accepter
 * de l'argent qui n'a jamais ete preleve.
 *
 * Convention conservee de l'ancien code : un numero finissant par 000 ou 999
 * simule un refus.
 */
@Service
@ConditionalOnProperty(name = "app.payments.simulated", havingValue = "true")
public class SimulatedPaymentGateway implements PaymentGateway {

    @Override
    public String name() { return "SIMULE"; }

    @Override
    public PaymentResult initiate(PaymentIntent intent) {
        String reference = intent.payerReference();
        if (reference != null && (reference.endsWith("000") || reference.endsWith("999")))
            return PaymentResult.refuse("Paiement mobile refuse (numero de test).");
        return PaymentResult.accepte("TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT));
    }
}
