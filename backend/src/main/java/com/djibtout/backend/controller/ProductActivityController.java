package com.djibtout.backend.controller;

import com.djibtout.backend.repository.OrderRepository;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
public class ProductActivityController {
    private final OrderRepository orders;
    public ProductActivityController(OrderRepository orders) { this.orders = orders; }

    @GetMapping("/{id}/activity")
    public Map<String, Object> activity(@PathVariable Long id) {
        long recentPurchases = orders.countRecentlyPurchased(id, LocalDateTime.now().minusHours(24));
        return Map.of("recentPurchases", recentPurchases, "windowHours", 24, "measuredAt", LocalDateTime.now());
    }
}
