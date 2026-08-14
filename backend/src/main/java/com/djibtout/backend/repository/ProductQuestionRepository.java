package com.djibtout.backend.repository;
import com.djibtout.backend.entity.ProductQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface ProductQuestionRepository extends JpaRepository<ProductQuestion,Long>{
 List<ProductQuestion> findByProductIdOrderByCreatedAtDesc(Long productId);
 List<ProductQuestion> findByProductSellerIdOrderByCreatedAtDesc(Long sellerId);
 List<ProductQuestion> findByUserIdOrderByCreatedAtDesc(Long userId);
 long countByProductSellerIdAndAnswerIsNull(Long sellerId);
}
