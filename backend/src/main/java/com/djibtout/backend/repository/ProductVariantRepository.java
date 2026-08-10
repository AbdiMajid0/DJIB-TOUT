package com.djibtout.backend.repository;

import com.djibtout.backend.entity.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductVariantRepository extends JpaRepository<ProductVariant, Long> {
    List<ProductVariant> findByProductIdOrderByIdAsc(Long productId);
    List<ProductVariant> findByProductIdAndActiveTrueOrderByIdAsc(Long productId);
    Optional<ProductVariant> findByProductIdAndSkuIgnoreCase(Long productId, String sku);
    @Lock(LockModeType.PESSIMISTIC_WRITE) @Query("select v from ProductVariant v where v.id=:id") Optional<ProductVariant> findByIdForUpdate(@Param("id") Long id);
}
