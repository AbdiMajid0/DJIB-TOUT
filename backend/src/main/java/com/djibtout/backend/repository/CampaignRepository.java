package com.djibtout.backend.repository;import com.djibtout.backend.entity.Campaign;import org.springframework.data.jpa.repository.JpaRepository;import java.util.List;
public interface CampaignRepository extends JpaRepository<Campaign,Long>{List<Campaign> findByActiveTrueOrderByDisplayOrderAsc();}
