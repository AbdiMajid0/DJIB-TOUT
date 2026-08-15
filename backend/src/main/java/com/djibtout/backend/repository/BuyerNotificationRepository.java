package com.djibtout.backend.repository;

import com.djibtout.backend.entity.BuyerNotification;
import com.djibtout.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BuyerNotificationRepository extends JpaRepository<BuyerNotification, Long> {
    List<BuyerNotification> findByUserOrderByCreatedAtDesc(User user);
    long countByUserAndReadFalse(User user);
}
