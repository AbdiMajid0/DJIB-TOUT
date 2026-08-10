package com.djibtout.backend.repository;

import com.djibtout.backend.entity.HomeSection;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface HomeSectionRepository extends JpaRepository<HomeSection,Long>{
    List<HomeSection> findByActiveTrueOrderByDisplayOrderAsc();
    Optional<HomeSection> findByKey(String key);
}
