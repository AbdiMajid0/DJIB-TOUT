package com.djibtout.backend.repository;

import com.djibtout.backend.entity.Product;
import com.djibtout.backend.entity.Review;
import com.djibtout.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByProductOrderByCreatedAtDesc(Product product);
    List<Review> findByUserOrderByCreatedAtDesc(User user);
    long countByProduct(Product product);
    List<Review> findByProductSellerIdOrderByCreatedAtDesc(Long sellerId);
    long countByProductSellerIdAndSellerResponseIsNull(Long sellerId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.product = :product")
    Double getAverageRatingForProduct(@Param("product") Product product);
}
