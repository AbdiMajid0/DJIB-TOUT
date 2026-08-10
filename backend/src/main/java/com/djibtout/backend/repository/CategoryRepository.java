package com.djibtout.backend.repository;
import com.djibtout.backend.entity.Category;import org.springframework.data.jpa.repository.JpaRepository;import java.util.List;
public interface CategoryRepository extends JpaRepository<Category,Long>{List<Category> findAllByOrderByDisplayOrderAscNameAsc();boolean existsBySlugAndIdNot(String slug,Long id);}
