package com.djibtout.backend.service.payment;

public record PaymentResult(PaymentOutcome outcome, String transactionId,
                            String redirectUrl, String failureReason) {

    public static PaymentResult accepte(String transactionId) {
        return new PaymentResult(PaymentOutcome.ACCEPTE, transactionId, null, null);
    }

    public static PaymentResult refuse(String motif) {
        return new PaymentResult(PaymentOutcome.REFUSE, null, null, motif);
    }

    /** Le paiement n'est pas acquis : seul le webhook du prestataire le confirmera. */
    public static PaymentResult redirection(String transactionId, String url) {
        return new PaymentResult(PaymentOutcome.REDIRECTION, transactionId, url, null);
    }
}
