package com.djibtout.backend.controller;

import com.djibtout.backend.entity.ProductInteraction;
import com.djibtout.backend.repository.ProductInteractionRepository;
import com.djibtout.backend.repository.ProductRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/products/{productId}/interactions")
public class ProductInteractionController {
    private final ProductInteractionRepository interactions; private final ProductRepository products;
    public ProductInteractionController(ProductInteractionRepository interactions,ProductRepository products){this.interactions=interactions;this.products=products;}
    @PostMapping public ResponseEntity<Void> track(@PathVariable Long productId,@Valid @RequestBody Request input){
        if(!products.existsById(productId))return ResponseEntity.notFound().build();
        ProductInteraction event=new ProductInteraction();event.setProductId(productId);event.setType(input.type());event.setPlacement(input.placement());interactions.save(event);
        return ResponseEntity.accepted().build();
    }
    public record Request(@NotNull ProductInteraction.Type type,@Size(max=80) String placement){}
}
