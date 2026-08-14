package com.djibtout.backend.repository;
import com.djibtout.backend.entity.*;import org.springframework.data.jpa.repository.JpaRepository;import java.util.List;
public interface SavedListRepository extends JpaRepository<SavedList,Long>{List<SavedList> findByUserOrderByCreatedAtDesc(User user);}
