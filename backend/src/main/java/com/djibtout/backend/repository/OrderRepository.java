package com.djibtout.backend.repository;

import com.djibtout.backend.entity.Order;
import com.djibtout.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByBuyerId(Long buyerId);
    List<Order> findByBuyerOrderByCreatedAtDesc(User buyer);
    org.springframework.data.domain.Page<Order> findByBuyerOrderByCreatedAtDesc(User buyer, org.springframework.data.domain.Pageable pageable);
    Optional<Order> findByBuyerAndIdempotencyKey(User buyer,String idempotencyKey);
    List<Order> findByStatusAndReservedUntilBefore(com.djibtout.backend.entity.OrderStatus status,LocalDateTime time);

    @Query("SELECT DISTINCT o FROM Order o JOIN o.items i JOIN i.product p WHERE p.seller.id = :sellerId ORDER BY o.createdAt DESC")
    List<Order> findOrdersBySellerId(@Param("sellerId") Long sellerId);

    @Query("SELECT COALESCE(SUM(i.quantity), 0) FROM Order o JOIN o.items i WHERE i.product.id = :productId AND o.createdAt >= :since")
    Long countRecentlyPurchased(@Param("productId") Long productId, @Param("since") LocalDateTime since);
    @Query("SELECT CASE WHEN COUNT(o)>0 THEN true ELSE false END FROM Order o JOIN o.items i WHERE o.buyer.id=:buyerId AND i.product.id=:productId AND o.status='DELIVERED'")
    boolean existsDeliveredPurchase(@Param("buyerId")Long buyerId,@Param("productId")Long productId);
}
