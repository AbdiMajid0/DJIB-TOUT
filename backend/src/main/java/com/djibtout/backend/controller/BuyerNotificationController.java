package com.djibtout.backend.controller;

import com.djibtout.backend.entity.BuyerNotification;
import com.djibtout.backend.entity.User;
import com.djibtout.backend.repository.BuyerNotificationRepository;
import com.djibtout.backend.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController @RequestMapping("/api/notifications")
public class BuyerNotificationController {
    private final BuyerNotificationRepository notifications;
    private final UserRepository users;

    public BuyerNotificationController(BuyerNotificationRepository n, UserRepository u) {
        notifications = n; users = u;
    }

    private User current(Authentication a) {
        return a == null ? null : users.findByEmail(a.getName()).orElse(null);
    }

    /** Vue compacte : `user` ne doit jamais partir dans la reponse. */
    private Map<String, Object> view(BuyerNotification n) {
        Map<String, Object> v = new LinkedHashMap<>();
        v.put("id", n.getId());
        v.put("title", n.getTitle());
        v.put("message", n.getMessage());
        v.put("link", n.getLink());
        v.put("read", n.isRead());
        v.put("createdAt", n.getCreatedAt());
        return v;
    }

    @GetMapping @Transactional(readOnly = true)
    public ResponseEntity<?> list(Authentication a) {
        User u = current(a);
        if (u == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(notifications.findByUserOrderByCreatedAtDesc(u).stream().map(this::view).toList());
    }

    @GetMapping("/unread-count") @Transactional(readOnly = true)
    public ResponseEntity<?> unread(Authentication a) {
        User u = current(a);
        if (u == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(Map.of("count", notifications.countByUserAndReadFalse(u)));
    }

    @PatchMapping("/{id}/read") @Transactional
    public ResponseEntity<?> read(Authentication a, @PathVariable Long id) {
        User u = current(a);
        BuyerNotification n = notifications.findById(id).orElse(null);
        if (u == null || n == null || !n.getUser().getId().equals(u.getId())) return ResponseEntity.status(403).build();
        n.setRead(true);
        return ResponseEntity.ok(view(notifications.save(n)));
    }

    @PatchMapping("/read-all") @Transactional
    public ResponseEntity<?> readAll(Authentication a) {
        User u = current(a);
        if (u == null) return ResponseEntity.status(401).build();
        List<BuyerNotification> values = notifications.findByUserOrderByCreatedAtDesc(u);
        values.forEach(n -> n.setRead(true));
        notifications.saveAll(values);
        return ResponseEntity.ok(Map.of("message", "Toutes les notifications ont été marquées comme lues."));
    }
}
