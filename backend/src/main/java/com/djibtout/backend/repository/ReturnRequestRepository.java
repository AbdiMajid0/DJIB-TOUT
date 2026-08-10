package com.djibtout.backend.repository;
import com.djibtout.backend.entity.*;import org.springframework.data.jpa.repository.JpaRepository;import java.util.List;
public interface ReturnRequestRepository extends JpaRepository<ReturnRequest,Long>{
    List<ReturnRequest> findByBuyerOrderByCreatedAtDesc(User buyer);
    List<ReturnRequest> findBySellerOrderByCreatedAtDesc(User seller);
    boolean existsByOrderItemAndStatusIn(OrderItem item,List<ReturnStatus> statuses);
}
