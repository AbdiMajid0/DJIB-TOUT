package com.djibtout.backend.service;

import com.djibtout.backend.entity.Product;
import com.djibtout.backend.repository.ProductRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public Optional<Product> getProductById(Long id) {
        return productRepository.findById(id);
    }

    public List<Product> getProductsByCategory(String category) {
        return productRepository.findByCategory(category);
    }

    public Page<Product> searchProducts(
            String query,
            String category,
            String brand,
            Long sellerId,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Integer minRating,
            Integer maxDeliveryDays,
            Boolean inStock,
            String sortParam,
            int page,
            int size
    ) {
        Sort sort = Sort.by(Sort.Direction.DESC, "id");
        if (sortParam != null) {
            switch (sortParam.toLowerCase()) {
                case "price_asc":
                    sort = Sort.by(Sort.Direction.ASC, "price");
                    break;
                case "price_desc":
                    sort = Sort.by(Sort.Direction.DESC, "price");
                    break;
                case "newest":
                    sort = Sort.by(Sort.Direction.DESC, "createdAt");
                    break;
                case "name_asc":
                    sort = Sort.by(Sort.Direction.ASC, "name");
                    break;
                case "rating_desc":
                    sort = Sort.by(Sort.Direction.DESC, "averageRating");
                    break;
            }
        }

        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, Math.min(size, 60)), sort);
        return productRepository.searchProducts(query, category, brand, sellerId, minPrice, maxPrice, minRating, maxDeliveryDays, inStock, pageable);
    }

    public Product saveProduct(Product product) {
        return productRepository.save(product);
    }

    public List<Product> getProductsBySellerId(Long sellerId) {
        return productRepository.findBySellerIdOrderByIdDesc(sellerId);
    }

    public void deleteProduct(Long id) {
        productRepository.deleteById(id);
    }
}
