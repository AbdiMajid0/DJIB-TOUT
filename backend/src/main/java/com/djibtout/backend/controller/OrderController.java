package com.djibtout.backend.controller;

import com.djibtout.backend.entity.Order;
import com.djibtout.backend.entity.OrderItem;
import com.djibtout.backend.entity.OrderStatus;
import com.djibtout.backend.entity.Product;
import com.djibtout.backend.entity.User;
import com.djibtout.backend.entity.Address;
import com.djibtout.backend.entity.Coupon;
import com.djibtout.backend.entity.DiscountType;
import com.djibtout.backend.repository.AddressRepository;
import com.djibtout.backend.repository.CouponRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import com.djibtout.backend.repository.OrderRepository;
import com.djibtout.backend.repository.ProductRepository;
import com.djibtout.backend.repository.UserRepository;
import com.djibtout.backend.repository.ProductVariantRepository;
import com.djibtout.backend.entity.ProductVariant;
import com.djibtout.backend.service.SellerEventService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.transaction.annotation.Transactional;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final AddressRepository addressRepository;
    private final CouponRepository couponRepository;
    private final ProductVariantRepository productVariantRepository;
    private final SellerEventService events;

    public OrderController(OrderRepository orderRepository, ProductRepository productRepository, UserRepository userRepository, AddressRepository addressRepository, CouponRepository couponRepository, ProductVariantRepository productVariantRepository, SellerEventService events) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.addressRepository = addressRepository;
        this.couponRepository = couponRepository;
        this.productVariantRepository=productVariantRepository;
        this.events=events;
    }

    @Transactional
    @PostMapping("/create")
    public ResponseEntity<?> createOrder(@RequestHeader(value="Idempotency-Key",required=false) String idempotencyKey,@Valid @RequestBody CreateOrderRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || authentication.getPrincipal().equals("anonymousUser")) {
            return ResponseEntity.status(401).body("Vous devez être connecté pour passer une commande.");
        }

        String email = authentication.getName();
        User buyer = userRepository.findByEmail(email).orElse(null);
        if (buyer == null) {
            return ResponseEntity.status(401).body("Utilisateur introuvable.");
        }
        if(idempotencyKey==null||idempotencyKey.isBlank()||idempotencyKey.length()>80)return ResponseEntity.badRequest().body("Clé d’idempotence requise.");
        var existing=orderRepository.findByBuyerAndIdempotencyKey(buyer,idempotencyKey.trim());
        if(existing.isPresent()){Order value=existing.get();return ResponseEntity.ok(new OrderResponse(true,"Commande déjà créée.",value.getId(),value.getTotalAmount(),value.getSubtotalAmount(),value.getDiscountAmount(),value.getDeliveryFee()));}

        if (request.getItems() == null || request.getItems().isEmpty()) {
            return ResponseEntity.badRequest().body("La commande ne peut pas être vide.");
        }

        Order order = new Order();
        order.setBuyer(buyer);
        order.setStatus(OrderStatus.PENDING);
        order.setPaymentMethod(request.getPaymentMethod());
        order.setDeliveryMethod("EXPRESS".equalsIgnoreCase(request.getDeliveryMethod())?"EXPRESS":"STANDARD");
        order.setIdempotencyKey(idempotencyKey.trim());
        order.setReservedUntil(java.time.LocalDateTime.now().plusMinutes(15));
        if (request.getAddressId() != null) {
            Address address = addressRepository.findById(request.getAddressId()).orElse(null);
            if (address == null || !address.getUser().getId().equals(buyer.getId())) {
                return ResponseEntity.badRequest().body("Adresse de livraison invalide.");
            }
            order.setDeliveryAddress(address.getLabel() + " - " + address.getFullAddress() + ", " + address.getCity());
        } else if (request.getDeliveryAddress() != null && !request.getDeliveryAddress().isBlank()) {
            order.setDeliveryAddress(request.getDeliveryAddress().trim());
        } else {
            return ResponseEntity.badRequest().body("Adresse de livraison requise.");
        }
        
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (OrderItemRequest itemReq : request.getItems()) {
            Product product = productRepository.findByIdForUpdate(itemReq.getProductId()).orElse(null);
            if (product == null) {
                return ResponseEntity.badRequest().body("Produit ID " + itemReq.getProductId() + " introuvable.");
            }
            
            ProductVariant variant = null;
            if (itemReq.getVariantId() != null) {
                variant = productVariantRepository.findByIdForUpdate(itemReq.getVariantId()).orElse(null);
                if (variant == null || !variant.getProduct().getId().equals(product.getId()) || !variant.isActive()) return ResponseEntity.badRequest().body("Variante produit invalide.");
            }
            int availableStock = variant != null ? variant.getStockQuantity() : product.getStockQuantity();
            if (availableStock < itemReq.getQuantity()) {
                return ResponseEntity.badRequest().body("Stock insuffisant pour le produit: " + product.getName());
            }

            if (variant != null) { variant.setStockQuantity(variant.getStockQuantity() - itemReq.getQuantity()); productVariantRepository.save(variant); }
            else { product.setStockQuantity(product.getStockQuantity() - itemReq.getQuantity()); productRepository.save(product); }

            OrderItem orderItem = new OrderItem();
            orderItem.setProduct(product);
            orderItem.setQuantity(itemReq.getQuantity());
            orderItem.setPrice(product.getPrice());
            if (variant != null) { orderItem.setVariant(variant); orderItem.setPrice(variant.getPrice()); }
            
            order.addItem(orderItem);
            
            totalAmount = totalAmount.add(orderItem.getPrice().multiply(new BigDecimal(itemReq.getQuantity())));
        }

        BigDecimal subtotalAmount=totalAmount;BigDecimal discountAmount=BigDecimal.ZERO;
        if (request.getCouponCode() != null && !request.getCouponCode().isBlank()) {
            Coupon coupon = couponRepository.findByCodeIgnoreCase(request.getCouponCode().trim()).orElse(null);
            if (coupon == null || !coupon.isUsable()) return ResponseEntity.badRequest().body("Coupon invalide ou expiré.");
            BigDecimal discount = coupon.getDiscountType() == DiscountType.PERCENTAGE
                    ? totalAmount.multiply(coupon.getDiscountValue()).divide(new BigDecimal("100"))
                    : coupon.getDiscountValue();
            discountAmount=discount.min(totalAmount);totalAmount = totalAmount.subtract(discountAmount).max(BigDecimal.ZERO);
            order.setCouponCode(coupon.getCode());
            coupon.setUsedCount(coupon.getUsedCount() + 1);
            couponRepository.save(coupon);
        }
        BigDecimal deliveryFee="EXPRESS".equals(order.getDeliveryMethod())?new BigDecimal("3000"):(subtotalAmount.compareTo(new BigDecimal("50000"))>=0?BigDecimal.ZERO:new BigDecimal("1500"));
        totalAmount=totalAmount.add(deliveryFee);order.setSubtotalAmount(subtotalAmount);order.setDiscountAmount(discountAmount);order.setDeliveryFee(deliveryFee);
        order.setTotalAmount(totalAmount);
        Order savedOrder = orderRepository.save(order);
        savedOrder.getItems().stream().map(i->i.getProduct().getSeller()).filter(java.util.Objects::nonNull).distinct().forEach(s->events.notify(s,"Nouvelle commande","La commande #"+savedOrder.getId()+" contient un ou plusieurs de vos produits."));
        savedOrder.getItems().stream().filter(i->i.getProduct().getStockQuantity()<=5).forEach(i->events.notify(i.getProduct().getSeller(),"Stock faible","Le stock de « "+i.getProduct().getName()+" » est maintenant de "+i.getProduct().getStockQuantity()+" unité(s)."));

        return ResponseEntity.ok(new OrderResponse(true,"Commande validée avec succès.",savedOrder.getId(),savedOrder.getTotalAmount(),savedOrder.getSubtotalAmount(),savedOrder.getDiscountAmount(),savedOrder.getDeliveryFee()));
    }

    @GetMapping("/my-orders")
    public ResponseEntity<?> getMyOrders() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || authentication.getPrincipal().equals("anonymousUser")) {
            return ResponseEntity.status(401).body("Vous devez être connecté.");
        }

        String email = authentication.getName();
        User buyer = userRepository.findByEmail(email).orElse(null);
        if (buyer == null) {
            return ResponseEntity.status(401).body("Utilisateur introuvable.");
        }

        List<Order> orders = orderRepository.findByBuyerOrderByCreatedAtDesc(buyer);
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/seller-orders")
    public ResponseEntity<?> getSellerOrders() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || authentication.getPrincipal().equals("anonymousUser")) {
            return ResponseEntity.status(401).body("Vous devez être connecté.");
        }

        String email = authentication.getName();
        User seller = userRepository.findByEmail(email).orElse(null);
        if (seller == null) return ResponseEntity.status(401).body("Utilisateur introuvable.");

        List<Order> orders = orderRepository.findOrdersBySellerId(seller.getId());
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getOrderById(@PathVariable Long id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || authentication.getPrincipal().equals("anonymousUser")) {
            return ResponseEntity.status(401).body("Vous devez être connecté.");
        }
        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) return ResponseEntity.status(401).body("Utilisateur introuvable.");

        Order order = orderRepository.findById(id).orElse(null);
        if (order == null) return ResponseEntity.status(404).body("Commande introuvable.");

        boolean isBuyer = order.getBuyer().getId().equals(user.getId());
        boolean isAdmin = user.getRole() == com.djibtout.backend.entity.Role.ADMIN;
        boolean isSeller = order.getItems().stream().anyMatch(item -> 
            item.getProduct().getSeller() != null && item.getProduct().getSeller().getId().equals(user.getId())
        );

        if (!isBuyer && !isAdmin && !isSeller) {
            return ResponseEntity.status(403).body("Accès refusé.");
        }

        return ResponseEntity.ok(order);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateOrderStatus(@PathVariable Long id, @RequestBody java.util.Map<String, String> body) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || authentication.getPrincipal().equals("anonymousUser")) {
            return ResponseEntity.status(401).body("Vous devez être connecté.");
        }
        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) return ResponseEntity.status(401).body("Utilisateur introuvable.");

        Order order = orderRepository.findById(id).orElse(null);
        if (order == null) return ResponseEntity.status(404).body("Commande introuvable.");

        boolean isAdmin = user.getRole() == com.djibtout.backend.entity.Role.ADMIN;
        if (!isAdmin) {
            return ResponseEntity.status(403).body("Accès refusé. Seul un vendeur ou un admin peut modifier le statut.");
        }

        String newStatusStr = body.get("status");
        if (newStatusStr == null) return ResponseEntity.badRequest().body("Statut manquant.");

        try {
            OrderStatus newStatus = OrderStatus.valueOf(newStatusStr);
            order.setStatus(newStatus);
            orderRepository.save(order);
            return ResponseEntity.ok(order);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Statut invalide.");
        }
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<?> cancelOrder(@PathVariable Long id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || authentication.getPrincipal().equals("anonymousUser")) {
            return ResponseEntity.status(401).body("Vous devez être connecté.");
        }
        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) return ResponseEntity.status(401).body("Utilisateur introuvable.");

        Order order = orderRepository.findById(id).orElse(null);
        if (order == null) return ResponseEntity.status(404).body("Commande introuvable.");

        boolean isBuyer = order.getBuyer().getId().equals(user.getId());
        boolean isAdmin = user.getRole() == com.djibtout.backend.entity.Role.ADMIN;

        if (!isBuyer && !isAdmin) {
            return ResponseEntity.status(403).body("Accès refusé. Vous ne pouvez pas annuler cette commande.");
        }

        if (order.getStatus() != OrderStatus.PENDING && order.getStatus() != OrderStatus.PROCESSING) {
            return ResponseEntity.badRequest().body("La commande ne peut plus être annulée à ce stade.");
        }

        order.setStatus(OrderStatus.CANCELLED);
        for(OrderItem item:order.getItems()){Product product=productRepository.findByIdForUpdate(item.getProduct().getId()).orElse(item.getProduct());product.setStockQuantity(product.getStockQuantity()+item.getQuantity());productRepository.save(product);}
        orderRepository.save(order);
        return ResponseEntity.ok(order);
    }
}

class CreateOrderRequest {
    @NotNull
    private String paymentMethod;
    private String deliveryAddress;
    private Long addressId;
    private String couponCode;
    private String deliveryMethod;
    @NotEmpty
    private List<OrderItemRequest> items;

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getDeliveryAddress() { return deliveryAddress; }
    public void setDeliveryAddress(String deliveryAddress) { this.deliveryAddress = deliveryAddress; }
    public Long getAddressId() { return addressId; }
    public void setAddressId(Long addressId) { this.addressId = addressId; }
    public String getCouponCode() { return couponCode; }
    public void setCouponCode(String couponCode) { this.couponCode = couponCode; }
    public String getDeliveryMethod(){return deliveryMethod;} public void setDeliveryMethod(String v){deliveryMethod=v;}

    public List<OrderItemRequest> getItems() { return items; }
    public void setItems(List<OrderItemRequest> items) { this.items = items; }
}

class OrderItemRequest {
    @NotNull
    private Long productId;
    private Long variantId;
    @Positive
    private int quantity;

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }
    public Long getVariantId(){return variantId;} public void setVariantId(Long variantId){this.variantId=variantId;}

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }
}

class OrderResponse {
    private boolean success;
    private String message;
    private Long orderId;
    private BigDecimal totalAmount;
    private BigDecimal subtotalAmount,discountAmount,deliveryFee;

    public OrderResponse(boolean success,String message,Long orderId,BigDecimal totalAmount,BigDecimal subtotalAmount,BigDecimal discountAmount,BigDecimal deliveryFee) {
        this.success = success;
        this.message = message;
        this.orderId = orderId;
        this.totalAmount = totalAmount;
        this.subtotalAmount=subtotalAmount;this.discountAmount=discountAmount;this.deliveryFee=deliveryFee;
    }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public BigDecimal getSubtotalAmount(){return subtotalAmount;} public BigDecimal getDiscountAmount(){return discountAmount;} public BigDecimal getDeliveryFee(){return deliveryFee;}
}
