package com.djibtout.backend;

import com.djibtout.backend.entity.Product;
import com.djibtout.backend.entity.Role;
import com.djibtout.backend.entity.User;
import com.djibtout.backend.repository.ProductRepository;
import com.djibtout.backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

// Donnees de demonstration : ce composant ne doit jamais s'executer
// ailleurs qu'en developpement. Sans cette restriction il creait un
// compte vendeur au mot de passe connu dans toute base vide, production
// comprise.
@Component @org.springframework.context.annotation.Profile("seed")
public class DataSeeder implements CommandLineRunner {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    public DataSeeder(ProductRepository productRepository, UserRepository userRepository, org.springframework.security.crypto.password.PasswordEncoder passwordEncoder) {
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        if (productRepository.count() > 0) {
            System.out.println("Base de données déjà initialisée avec des produits. Saut du DataSeeder.");
            return;
        }
        
        System.out.println("Initialisation avec des produits de test...");

        User seller = userRepository.findByEmail("seller@test.com").orElseGet(() -> {
            User newUser = new User();
            newUser.setName("Test Seller");
            newUser.setEmail("seller@test.com");
            newUser.setPassword(passwordEncoder.encode("password"));
            newUser.setRole(Role.SELLER);
            return userRepository.save(newUser);
        });

        List<Product> products = List.of(
            // Électronique
            createProduct("Samsung Galaxy S23 Ultra", "Le summum de la technologie.", new BigDecimal("215000"), 15, "telephones-accessoires", "📱", seller),
            createProduct("Apple iPhone 15 Pro", "Puce A17 Pro.", new BigDecimal("245000"), 8, "telephones-accessoires", "📱", seller),
            createProduct("MacBook Air M2", "Ultra-fin, ultra-rapide.", new BigDecimal("195000"), 20, "ordinateurs-tablettes", "💻", seller),
            createProduct("Machine à café Nespresso", "Un café parfait.", new BigDecimal("18500"), 10, "petit-electromenager", "☕", seller),
            
            // Mode Femme
            createProduct("Robe de Soirée Rouge", "Élégante robe pour vos soirées.", new BigDecimal("15000"), 30, "robes", "👗", seller),
            createProduct("Veste en Cuir Femme", "Veste 100% cuir véritable.", new BigDecimal("35000"), 12, "manteaux-vestes", "🧥", seller),
            createProduct("T-shirt Basique Femme", "100% coton bio.", new BigDecimal("4500"), 100, "t-shirts", "👕", seller),
            createProduct("Baskets Nike Air Max Femme", "Confort et style.", new BigDecimal("22000"), 25, "baskets-femme", "👟", seller),
            createProduct("Sac à Main en Cuir", "Sac à main élégant Noir.", new BigDecimal("18000"), 40, "sacs-femme", "👜", seller),
            
            // Mode Homme
            createProduct("Costume Homme Bleu", "Costume 3 pièces slim.", new BigDecimal("45000"), 15, "costumes", "👔", seller),
            createProduct("Polo Ralph Lauren", "Polo classique.", new BigDecimal("12500"), 50, "polos", "👕", seller),
            createProduct("Chaussures de Ville", "Cuir marron.", new BigDecimal("28000"), 20, "chaussures-homme", "👞", seller),
            
            // Maison
            createProduct("Canapé 3 places", "Canapé confortable en velours.", new BigDecimal("150000"), 5, "salon", "🛋️", seller),
            createProduct("Lit Double King Size", "Lit en bois massif.", new BigDecimal("120000"), 3, "chambre", "🛏️", seller),
            createProduct("Set de Poêles Tefal", "Anti-adhésif.", new BigDecimal("12000"), 30, "casseroles-poeles", "🍳", seller),
            createProduct("Vase en Céramique", "Design moderne.", new BigDecimal("4000"), 50, "vases", "🏺", seller),
            
            // Supermarché
            createProduct("Pâtes Barilla 500g", "Spaghetti.", new BigDecimal("500"), 200, "pates-riz", "🍝", seller),
            createProduct("Café Lavazza 1kg", "Café en grains.", new BigDecimal("4500"), 100, "cafe", "☕", seller),
            createProduct("Jus d'Orange Pressé", "100% pur jus.", new BigDecimal("800"), 150, "jus-de-fruits", "🧃", seller)
        );

        productRepository.saveAll(products);
        System.out.println("Produits de test ajoutés avec succès !");
    }

    private Product createProduct(String name, String description, BigDecimal price, int stock, String category, String image, User seller) {
        Product p = new Product();
        p.setName(name);
        p.setDescription(description);
        p.setPrice(price);
        p.setStockQuantity(stock);
        p.setCategory(category);
        // Ne rien mettre dans `images` : le champ attend des URL, et un emoji y
        // produisait un <img src="emoji"> casse cote client. Laisse vide,
        // l'interface affiche son propre repli.
        p.setSeller(seller);
        return p;
    }
}
