package com.djibtout.backend.repository;
import com.djibtout.backend.entity.*; import org.springframework.data.jpa.repository.JpaRepository; import java.util.List;
public interface AddressRepository extends JpaRepository<Address,Long>{ List<Address> findByUserOrderByIsDefaultDescIdDesc(User user); }
