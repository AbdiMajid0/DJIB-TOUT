package com.djibtout.backend;

import com.djibtout.backend.controller.ProductController;
import com.djibtout.backend.entity.Product;
import com.djibtout.backend.entity.Role;
import com.djibtout.backend.entity.User;
import com.djibtout.backend.repository.UserRepository;
import com.djibtout.backend.service.ProductService;
import com.djibtout.backend.service.SellerAccessService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ProductControllerTests {
    ProductService products = mock(ProductService.class);
    UserRepository users = mock(UserRepository.class);
    SellerAccessService access = mock(SellerAccessService.class);
    ProductController controller = new ProductController(products, users, access);

    @AfterEach
    void clearAuthentication() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void invisibleProductIsAbsentForPublicCaller() {
        Product product = invisibleProduct();
        when(products.getProductById(1L)).thenReturn(Optional.of(product));
        when(access.canManageCatalog(null, product)).thenReturn(false);

        ResponseEntity<Product> response = controller.getProductById(1L);

        assertEquals(404, response.getStatusCode().value());
        assertNull(response.getBody());
    }

    @Test
    void invisibleProductIsReadableByItsOwner() {
        User owner = user(7L, Role.SELLER, "owner@test.local");
        Product product = invisibleProduct();
        product.setSeller(owner);
        when(products.getProductById(1L)).thenReturn(Optional.of(product));
        when(users.findByEmail(owner.getEmail())).thenReturn(Optional.of(owner));
        when(access.canManageCatalog(owner, product)).thenReturn(true);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(owner.getEmail(), null, List.of()));

        ResponseEntity<Product> response = controller.getProductById(1L);

        assertEquals(200, response.getStatusCode().value());
        assertSame(product, response.getBody());
    }

    @Test
    void invisibleProductIsReadableByAdmin() {
        User admin = user(8L, Role.ADMIN, "admin@test.local");
        Product product = invisibleProduct();
        when(products.getProductById(1L)).thenReturn(Optional.of(product));
        when(users.findByEmail(admin.getEmail())).thenReturn(Optional.of(admin));
        when(access.canManageCatalog(admin, product)).thenReturn(true);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(admin.getEmail(), null, List.of()));

        ResponseEntity<Product> response = controller.getProductById(1L);

        assertEquals(200, response.getStatusCode().value());
        assertSame(product, response.getBody());
    }

    private Product invisibleProduct() {
        Product product = new Product();
        product.setId(1L);
        product.setVisible(false);
        return product;
    }

    private User user(long id, Role role, String email) {
        User user = new User();
        user.setId(id);
        user.setRole(role);
        user.setEmail(email);
        return user;
    }
}
