package com.djibtout.backend.repository;

import com.djibtout.backend.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE) @Query("select p from Product p where p.id=:id") Optional<Product> findByIdForUpdate(@Param("id") Long id);
    @Query("SELECT i.product FROM OrderItem i WHERE i.product.visible = true GROUP BY i.product ORDER BY SUM(i.quantity) DESC")
    List<Product> findBestSellers(Pageable pageable);
    List<Product> findByCategory(String category);
    List<Product> findBySellerId(Long sellerId);
    List<Product> findBySellerIdOrderByIdDesc(Long sellerId);
    @Query("select p.category, count(p) from Product p where p.visible is null or p.visible=true group by p.category order by count(p) desc") List<Object[]> categoryCounts();
    @Query("select p.brand, count(p) from Product p where p.brand is not null and (p.visible is null or p.visible=true) group by p.brand order by count(p) desc") List<Object[]> brandCounts();
    @Query("select p.seller.id, p.seller.name, count(p) from Product p where p.seller is not null and (p.visible is null or p.visible=true) group by p.seller.id,p.seller.name order by count(p) desc") List<Object[]> sellerCounts();

    @Query("SELECT p FROM Product p WHERE " +
           "(:query IS NULL OR :query = '' OR LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(p.description) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
           "(:category IS NULL OR :category = '' OR LOWER(p.category) = LOWER(:category)) AND " +
           "(:brand IS NULL OR :brand = '' OR LOWER(p.brand) = LOWER(:brand)) AND " +
           "(:sellerId IS NULL OR p.seller.id = :sellerId) AND " +
           "(:minPrice IS NULL OR p.price >= :minPrice) AND " +
           "(:maxPrice IS NULL OR p.price <= :maxPrice) AND " +
           "(:minRating IS NULL OR (select coalesce(avg(r.rating),0) from Review r where r.product=p) >= :minRating) AND " +
           "(:maxDeliveryDays IS NULL OR p.deliveryDays <= :maxDeliveryDays) AND " +
           "(:inStock IS NULL OR :inStock = false OR p.stockQuantity > 0) AND (p.visible IS NULL OR p.visible = true)")
    Page<Product> searchProducts(
            @Param("query") String query,
            @Param("category") String category,
            @Param("brand") String brand,
            @Param("sellerId") Long sellerId,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            @Param("minRating") Integer minRating,
            @Param("maxDeliveryDays") Integer maxDeliveryDays,
            @Param("inStock") Boolean inStock,
            Pageable pageable
    );
}
