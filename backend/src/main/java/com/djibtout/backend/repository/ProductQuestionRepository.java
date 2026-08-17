package com.djibtout.backend.repository;
import com.djibtout.backend.entity.ProductQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
public interface ProductQuestionRepository extends JpaRepository<ProductQuestion,Long>{
 // Questions publiques : une question masquee par la moderation disparait.
 @Query("SELECT q FROM ProductQuestion q WHERE q.product.id = :productId AND (q.hidden IS NULL OR q.hidden = false) ORDER BY q.createdAt DESC")
 List<ProductQuestion> findVisibleByProductId(@Param("productId") Long productId);
 List<ProductQuestion> findByProductSellerIdOrderByCreatedAtDesc(Long sellerId);
 List<ProductQuestion> findByUserIdOrderByCreatedAtDesc(Long userId);
 long countByProductSellerIdAndAnswerIsNull(Long sellerId);
}
