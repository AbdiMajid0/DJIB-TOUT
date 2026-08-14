package com.djibtout.backend.repository;
import com.djibtout.backend.entity.RefreshToken;
import com.djibtout.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface RefreshTokenRepository extends JpaRepository<RefreshToken,Long>{Optional<RefreshToken> findByTokenHash(String hash);long deleteByUser(User user);java.util.List<RefreshToken> findByUserOrderByCreatedAtDesc(User user);}
