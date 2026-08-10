package com.djibtout.backend;
import com.djibtout.backend.security.JwtUtil;import org.junit.jupiter.api.Test;import org.springframework.security.core.userdetails.User;import static org.junit.jupiter.api.Assertions.*;
class JwtUtilTests{
 @Test void rejectsShortSecret(){assertThrows(IllegalStateException.class,()->new JwtUtil("too-short",1000,1000));}
 @Test void createsAndValidatesAccessAndRefreshTokens(){JwtUtil jwt=new JwtUtil("test-secret-that-is-definitely-longer-than-thirty-two-characters",60000,120000);var user=User.withUsername("test@example.com").password("x").roles("BUYER").build();String access=jwt.generateToken(user),refresh=jwt.generateRefreshToken(user);assertTrue(jwt.validateToken(access,user));assertFalse(jwt.validateToken(refresh,user));assertFalse(jwt.isRefreshToken(access));assertTrue(jwt.isRefreshToken(refresh));assertEquals("test@example.com",jwt.extractUsername(refresh));}
}
