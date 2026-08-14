package com.djibtout.backend;

import com.djibtout.backend.entity.*;
import com.djibtout.backend.repository.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class BuyerJourneyIntegrationTests {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired UserRepository users;
    @Autowired ProductRepository products;
    @Autowired CouponRepository coupons;
    @Autowired OrderRepository orders;
    @Autowired PaymentRepository payments;
    @Autowired PasswordEncoder encoder;

    @Test
    void completeBuyerJourneyFromRegistrationToPaidOrder() throws Exception {
        String suffix=UUID.randomUUID().toString().substring(0,8);
        String email="buyer-"+suffix+"@test.local";
        String password="SecurePass123!";

        User seller=new User();seller.setName("Vendeur test");seller.setEmail("seller-"+suffix+"@test.local");seller.setPassword(encoder.encode(password));seller.setRole(Role.SELLER);seller.setEmailVerified(true);seller=users.save(seller);
        Product product=new Product();product.setName("Produit parcours test");product.setDescription("Produit isolé");product.setPrice(new BigDecimal("10000"));product.setStockQuantity(5);product.setCategory("Tests");product.setSeller(seller);product=products.save(product);
        Coupon coupon=new Coupon();coupon.setCode("FLOW"+suffix.toUpperCase());coupon.setDiscountType(DiscountType.PERCENTAGE);coupon.setDiscountValue(new BigDecimal("10"));coupon.setActive(true);coupons.save(coupon);

        String registration=mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(java.util.Map.of("name","Client test","email",email,"password",password,"role","BUYER"))))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        String verificationToken=json.readTree(registration).get("developmentVerificationToken").asText();
        mvc.perform(post("/api/auth/verify-email").contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(java.util.Map.of("token",verificationToken))))
                .andExpect(status().isOk());

        String login=mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(java.util.Map.of("email",email,"password",password))))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        String bearer="Bearer "+json.readTree(login).get("token").asText();

        String address=mvc.perform(post("/api/addresses").header("Authorization",bearer).contentType(MediaType.APPLICATION_JSON).content("{\"label\":\"Maison\",\"fullAddress\":\"Rue de test\",\"city\":\"Djibouti-ville\",\"phone\":\"77123456\",\"isDefault\":true}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        long addressId=json.readTree(address).get("id").asLong();

        mvc.perform(get("/api/coupons/validate/{code}",coupon.getCode()).header("Authorization",bearer)).andExpect(status().isOk());
        String orderBody=json.writeValueAsString(java.util.Map.of("paymentMethod","WAAFI","addressId",addressId,"couponCode",coupon.getCode(),"deliveryMethod","STANDARD","items",java.util.List.of(java.util.Map.of("productId",product.getId(),"quantity",2))));
        String orderResponse=mvc.perform(post("/api/orders/create").header("Authorization",bearer).header("Idempotency-Key","flow-"+suffix).contentType(MediaType.APPLICATION_JSON).content(orderBody))
                .andExpect(status().isOk()).andExpect(jsonPath("$.discountAmount").value(2000)).andReturn().getResponse().getContentAsString();
        JsonNode orderJson=json.readTree(orderResponse);long orderId=orderJson.get("orderId").asLong();BigDecimal total=orderJson.get("totalAmount").decimalValue();

        mvc.perform(post("/api/payments/process").header("Authorization",bearer).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(java.util.Map.of("orderId",orderId,"paymentMethod","WAAFI","phoneNumber","77123456","amount",total))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.success").value(true)).andExpect(jsonPath("$.transactionId").isNotEmpty());
        mvc.perform(get("/api/orders/{id}",orderId).header("Authorization",bearer)).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("PROCESSING"));

        Order stored=orders.findById(orderId).orElseThrow();
        assertEquals(0,new BigDecimal("19500").compareTo(stored.getTotalAmount()));
        assertTrue(payments.findFirstByOrderAndStatusOrderByCreatedAtDesc(stored,"SUCCESS").isPresent());
        assertTrue(users.findByEmail(email).orElseThrow().isEmailVerified());
    }
}
