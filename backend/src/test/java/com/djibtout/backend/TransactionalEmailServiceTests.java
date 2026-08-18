package com.djibtout.backend;
import com.djibtout.backend.service.TransactionalEmailService;
import jakarta.mail.Session;import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;
import java.util.Properties;
import static org.junit.jupiter.api.Assertions.*;import static org.mockito.Mockito.*;

class TransactionalEmailServiceTests{
 JavaMailSender mail=mock(JavaMailSender.class);
 TransactionalEmailService emails=new TransactionalEmailService(mail);

 @BeforeEach void setUp(){
  ReflectionTestUtils.setField(emails,"from","no-reply@djibtout.com");
  ReflectionTestUtils.setField(emails,"frontend","https://djibtout.example");
  when(mail.createMimeMessage()).thenAnswer(inv->new MimeMessage(Session.getInstance(new Properties())));
 }

 MimeMessage sent() throws Exception{
  ArgumentCaptor<MimeMessage> message=ArgumentCaptor.forClass(MimeMessage.class);
  verify(mail).send(message.capture());
  return message.getValue();
 }

 String content(MimeMessage message) throws Exception{return message.getContent().toString();}

 @Test void verificationMailCarriesTheTokenisedLink() throws Exception{
  emails.verification("buyer@test.local","tok-123");
  MimeMessage message=sent();
  assertEquals("Vérifiez votre adresse e-mail — DJIB TOUT",message.getSubject());
  assertEquals("buyer@test.local",message.getAllRecipients()[0].toString());
  assertEquals("DJIB TOUT <no-reply@djibtout.com>",message.getFrom()[0].toString());
  assertTrue(content(message).contains("https://djibtout.example/verify-email?token=tok-123"));
 }

 @Test void passwordResetMailAnnouncesItsThirtyMinuteWindow() throws Exception{
  emails.passwordReset("buyer@test.local","tok-456");
  MimeMessage message=sent();
  assertEquals("Réinitialisez votre mot de passe — DJIB TOUT",message.getSubject());
  String body=content(message);
  assertTrue(body.contains("https://djibtout.example/reset-password?token=tok-456"));
  assertTrue(body.contains("30 minutes"));
 }

 @Test void bodyIsSentAsHtml() throws Exception{
  emails.verification("buyer@test.local","tok-123");
  MimeMessage message=sent();
  message.saveChanges();
  assertTrue(message.getContentType().startsWith("text/html"));
 }

 @Test void aBrokenRecipientAddressIsReportedAsIllegalState(){
  assertThrows(IllegalStateException.class,()->emails.verification("pas une adresse","tok-123"));
  verify(mail,never()).send(any(MimeMessage.class));
 }
}
