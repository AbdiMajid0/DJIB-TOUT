package com.djibtout.backend.repository;
import com.djibtout.backend.entity.*; import org.springframework.data.jpa.repository.JpaRepository; import java.util.Optional;
public interface WalletRepository extends JpaRepository<Wallet,Long>{ Optional<Wallet> findByUser(User user); }
