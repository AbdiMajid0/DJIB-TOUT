package com.djibtout.backend.repository;
import com.djibtout.backend.entity.Coupon; import org.springframework.data.jpa.repository.JpaRepository; import java.util.*;
public interface CouponRepository extends JpaRepository<Coupon,Long>{ Optional<Coupon> findByCodeIgnoreCase(String code); List<Coupon> findByActiveTrue(); }
