package com.djibtout.backend.repository;

import com.djibtout.backend.entity.Order;
import com.djibtout.backend.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByOrderOrderByCreatedAtDesc(Order order);
    Optional<Payment> findByTransactionId(String transactionId);
    Optional<Payment> findFirstByOrderAndStatusOrderByCreatedAtDesc(Order order, String status);
    List<Payment> findByOrderBuyerOrderByCreatedAtDesc(com.djibtout.backend.entity.User buyer);
}
