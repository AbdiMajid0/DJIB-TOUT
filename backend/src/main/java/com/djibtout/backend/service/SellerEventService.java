package com.djibtout.backend.service;

import com.djibtout.backend.entity.*;
import com.djibtout.backend.repository.*;
import org.springframework.stereotype.Service;

@Service
public class SellerEventService {
    private final SellerNotificationRepository notifications;
    private final AuditLogRepository audits;
    public SellerEventService(SellerNotificationRepository notifications, AuditLogRepository audits){this.notifications=notifications;this.audits=audits;}
    public void notify(User seller,String title,String message){if(seller==null)return;SellerNotification n=new SellerNotification();n.setSeller(seller);n.setTitle(title);n.setMessage(message);notifications.save(n);}
    public void audit(User actor,String action,String target){if(actor==null)return;AuditLog log=new AuditLog();log.setActor(actor);log.setAction(action);log.setTarget(target);audits.save(log);}
}
