package com.djibtout.backend.service;

import com.djibtout.backend.entity.BuyerNotification;
import com.djibtout.backend.entity.User;
import com.djibtout.backend.repository.BuyerNotificationRepository;
import org.springframework.stereotype.Service;

/**
 * Emission des notifications acheteur. Volontairement tolerante : prevenir un
 * client ne doit jamais faire echouer le paiement, l'expedition ou la decision
 * de retour qui l'a declenchee.
 */
@Service
public class BuyerNotificationService {
    private final BuyerNotificationRepository notifications;

    public BuyerNotificationService(BuyerNotificationRepository notifications) {
        this.notifications = notifications;
    }

    public void notify(User user, String title, String message, String link) {
        if (user == null || title == null || title.isBlank()) return;
        try {
            BuyerNotification n = new BuyerNotification();
            n.setUser(user);
            n.setTitle(title.length() > 120 ? title.substring(0, 120) : title);
            n.setMessage(message);
            n.setLink(link);
            notifications.save(n);
        } catch (Exception ignored) {
            // Une notification perdue est moins grave qu'une operation metier
            // interrompue : on n'annule pas la transaction appelante.
        }
    }
}
