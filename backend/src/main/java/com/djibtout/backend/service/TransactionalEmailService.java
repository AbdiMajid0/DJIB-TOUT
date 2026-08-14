package com.djibtout.backend.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.io.UnsupportedEncodingException;

@Service
@ConditionalOnProperty(name = "app.mail.enabled", havingValue = "true")
public class TransactionalEmailService {
    private final JavaMailSender mail;

    @Value("${app.mail.from:no-reply@djibtout.com}")
    private String from;

    @Value("${app.frontend-url:http://localhost:5174}")
    private String frontend;

    public TransactionalEmailService(JavaMailSender mail) {
        this.mail = mail;
    }

    public void verification(String email, String token) {
        String link = frontend + "/verify-email?token=" + token;
        send(email, "Vérifiez votre adresse e-mail — DJIB TOUT",
                "Vérifiez votre adresse e-mail",
                "Bienvenue sur DJIB TOUT. Confirmez votre adresse pour sécuriser votre compte et accéder à toutes les fonctionnalités.",
                "Vérifier mon adresse", link,
                "Ce lien reste valable jusqu’à son utilisation.");
    }

    public void passwordReset(String email, String token) {
        String link = frontend + "/reset-password?token=" + token;
        send(email, "Réinitialisez votre mot de passe — DJIB TOUT",
                "Nouveau mot de passe",
                "Nous avons reçu une demande de réinitialisation pour votre compte DJIB TOUT. Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.",
                "Réinitialiser mon mot de passe", link,
                "Ce lien expire dans 30 minutes. Si vous n’êtes pas à l’origine de cette demande, ignorez simplement cet e-mail.");
    }

    private void send(String to, String subject, String title, String introduction,
                      String button, String link, String notice) {
        MimeMessage message = mail.createMimeMessage();
        try {
            MimeMessageHelper helper = new MimeMessageHelper(message, false, StandardCharsets.UTF_8.name());
            helper.setFrom(from, "DJIB TOUT");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html(title, introduction, button, link, notice), true);
            mail.send(message);
        } catch (MessagingException | UnsupportedEncodingException e) {
            throw new IllegalStateException("Impossible de préparer l’e-mail transactionnel.", e);
        }
    }

    private String html(String title, String introduction, String button, String link, String notice) {
        return """
            <!doctype html><html lang="fr"><head><meta charset="UTF-8"></head>
            <body style="margin:0;background:#f4f6f8;font-family:Arial,sans-serif;color:#0d1b2a">
              <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="background:#f4f6f8;padding:36px 12px">
                <tr><td align="center">
                  <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 8px 30px rgba(13,27,42,.08)">
                    <tr><td style="background:#0d1b2a;padding:26px 34px;color:#fff;font-size:25px;font-weight:800">DJIB <span style="color:#fb553b">TOUT</span></td></tr>
                    <tr><td style="padding:42px 34px 18px"><div style="display:inline-block;background:#fff0ed;color:#d83b25;border-radius:99px;padding:7px 12px;font-size:12px;font-weight:700">SÉCURITÉ DU COMPTE</div><h1 style="font-size:28px;line-height:1.25;margin:18px 0 12px">%s</h1><p style="font-size:16px;line-height:1.7;color:#536275;margin:0">%s</p></td></tr>
                    <tr><td align="center" style="padding:20px 34px 28px"><a href="%s" style="display:inline-block;background:#fb553b;color:#fff;text-decoration:none;border-radius:99px;padding:15px 28px;font-weight:800">%s</a></td></tr>
                    <tr><td style="padding:0 34px 34px"><div style="background:#f7f8fa;border-radius:12px;padding:16px;color:#687588;font-size:13px;line-height:1.6">%s</div><p style="font-size:12px;color:#8793a4;line-height:1.6;margin:22px 0 6px">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :</p><p style="font-size:12px;word-break:break-all;color:#d83b25;margin:0">%s</p></td></tr>
                    <tr><td style="border-top:1px solid #edf0f3;padding:22px 34px;color:#98a2b1;font-size:12px">© 2026 DJIB TOUT · La marketplace de Djibouti</td></tr>
                  </table>
                </td></tr>
              </table>
            </body></html>
            """.formatted(title, introduction, link, button, notice, link);
    }
}
