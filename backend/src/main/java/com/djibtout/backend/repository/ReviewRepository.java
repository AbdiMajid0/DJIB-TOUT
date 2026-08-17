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
    // Avis publics. `hidden` est nullable en base, sans valeur par defaut :
    // tester l'egalite a false seule ecarterait toutes les lignes existantes.
    // Meme convention que `Product.visible`.
    @Query("SELECT r FROM Review r WHERE r.product = :product AND (r.hidden IS NULL OR r.hidden = false) ORDER BY r.createdAt DESC")
    List<Review> findVisibleByProduct(@Param("product") Product product);
    List<Review> findByUserOrderByCreatedAtDesc(User user);
    org.springframework.data.domain.Page<Review> findByUserOrderByCreatedAtDesc(User user, org.springframework.data.domain.Pageable pageable);
    @Query("SELECT COUNT(r) FROM Review r WHERE r.product = :product AND (r.hidden IS NULL OR r.hidden = false)")
    long countVisibleByProduct(@Param("product") Product product);
    List<Review> findByProductSellerIdOrderByCreatedAtDesc(Long sellerId);
    long countByProductSellerIdAndSellerResponseIsNull(Long sellerId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.product = :product AND (r.hidden IS NULL OR r.hidden = false)")
    Double getAverageRatingForProduct(@Param("product") Product product);
}
