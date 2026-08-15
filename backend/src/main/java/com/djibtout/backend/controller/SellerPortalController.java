package com.djibtout.backend.controller;

import com.djibtout.backend.entity.*;
import com.djibtout.backend.repository.*;
import com.djibtout.backend.service.SellerAccessService;
import com.djibtout.backend.service.SellerEventService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.apache.poi.ss.usermodel.*;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/seller")
public class SellerPortalController {
    private final UserRepository users;
    private final ProductRepository products;
    private final OrderRepository orders;
    private final SellerStoreRepository stores;
    private final SellerFulfillmentRepository fulfillments;
    private final ProductQuestionRepository questions;
    private final ReviewRepository reviews;
    private final ReturnRequestRepository returnRequests;
    private final SellerAccessService access;
    private final SellerSettlementRepository settlements;
    private final SellerEventService events;
    private final com.djibtout.backend.service.BuyerNotificationService buyerNotifications;

    public SellerPortalController(UserRepository users, ProductRepository products, OrderRepository orders,
                                  SellerStoreRepository stores, SellerFulfillmentRepository fulfillments, ProductQuestionRepository questions, ReviewRepository reviews, ReturnRequestRepository returnRequests, SellerAccessService access, SellerSettlementRepository settlements, SellerEventService events, com.djibtout.backend.service.BuyerNotificationService buyerNotifications) {
        this.users = users; this.products = products; this.orders = orders;
        this.stores = stores; this.fulfillments = fulfillments; this.questions = questions; this.reviews = reviews; this.returnRequests=returnRequests; this.access=access;this.settlements=settlements;this.events=events;this.buyerNotifications=buyerNotifications;
    }

    private User seller(Authentication authentication) {
        User user = authentication == null ? null : users.findByEmail(authentication.getName()).orElse(null);
        return user != null && (user.getRole() == Role.SELLER || user.getRole() == Role.ADMIN) ? user : null;
    }

    @Transactional(readOnly = true)
    @GetMapping("/dashboard")
    public ResponseEntity<?> dashboard(Authentication authentication) {
        User seller = seller(authentication);
        if (seller == null) return ResponseEntity.status(403).build();
        List<Product> sellerProducts = products.findBySellerIdOrderByIdDesc(seller.getId());
        List<Order> sellerOrders = orders.findOrdersBySellerId(seller.getId());
        BigDecimal revenue = sellerOrders.stream()
                .filter(order -> order.getStatus() != OrderStatus.PENDING && order.getStatus() != OrderStatus.CANCELLED)
                .flatMap(order -> order.getItems().stream()).filter(item -> belongsToSeller(item, seller))
                .map(item -> item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return ResponseEntity.ok(Map.of("revenue", revenue, "orders", sellerOrders.size(),
                "products", sellerProducts.size(),
                "lowStock", sellerProducts.stream().filter(p -> p.getStockQuantity() > 0 && p.getStockQuantity() <= 5).count(),
                "outOfStock", sellerProducts.stream().filter(p -> p.getStockQuantity() == 0).count(),
                "pendingQuestions", questions.countByProductSellerIdAndAnswerIsNull(seller.getId()),
                "pendingReviews", reviews.countByProductSellerIdAndSellerResponseIsNull(seller.getId())));
    }

    @GetMapping("/store")
    public ResponseEntity<?> store(Authentication authentication) {
        User seller = seller(authentication);
        if (seller == null) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(stores.findBySeller(seller).orElseGet(() -> {
            SellerStore store = new SellerStore(); store.setSeller(seller); store.setName(seller.getName());
            return stores.save(store);
        }));
    }

    @Transactional(readOnly = true)
    @GetMapping("/analytics")
    public ResponseEntity<?> analytics(Authentication authentication, @RequestParam(defaultValue = "30") int days) {
        User seller=seller(authentication); if(seller==null)return ResponseEntity.status(403).build();
        int safeDays=Math.max(1,Math.min(days,365)); LocalDateTime since=LocalDateTime.now().minusDays(safeDays);
        List<Order> scope=orders.findOrdersBySellerId(seller.getId()).stream().filter(o->o.getCreatedAt()!=null&&o.getCreatedAt().isAfter(since)&&o.getStatus()!=OrderStatus.CANCELLED).toList();
        Map<String,BigDecimal> byProduct=new LinkedHashMap<>(); Map<String,Integer> units=new LinkedHashMap<>(); BigDecimal revenue=BigDecimal.ZERO;
        for(Order order:scope) for(OrderItem item:order.getItems()) if(belongsToSeller(item,seller)){BigDecimal value=item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()));revenue=revenue.add(value);byProduct.merge(item.getProduct().getName(),value,BigDecimal::add);units.merge(item.getProduct().getName(),item.getQuantity(),Integer::sum);}
        List<Map<String,Object>> top=byProduct.entrySet().stream().sorted(Map.Entry.<String,BigDecimal>comparingByValue().reversed()).limit(5).map(e->Map.<String,Object>of("name",e.getKey(),"revenue",e.getValue(),"units",units.get(e.getKey()))).toList();
        long returns=returnRequests.findBySellerOrderByCreatedAtDesc(seller).stream().filter(r->r.getCreatedAt()!=null&&r.getCreatedAt().isAfter(since)).count();
        return ResponseEntity.ok(Map.of("days",safeDays,"revenue",revenue,"orders",scope.size(),"averageOrder",scope.isEmpty()?BigDecimal.ZERO:revenue.divide(BigDecimal.valueOf(scope.size()),2,java.math.RoundingMode.HALF_UP),"returns",returns,"returnRate",scope.isEmpty()?0:Math.round(returns*1000d/scope.size())/10d,"topProducts",top));
    }

    @PutMapping("/store")
    public ResponseEntity<?> saveStore(Authentication authentication, @Valid @RequestBody StoreInput input) {
        User seller = seller(authentication);
        if (seller == null) return ResponseEntity.status(403).build();
        SellerStore store = stores.findBySeller(seller).orElseGet(SellerStore::new);
        store.setSeller(seller); store.setName(input.name().trim()); store.setDescription(input.description());
        store.setLogoUrl(input.logoUrl()); store.setBannerUrl(input.bannerUrl()); store.setPolicies(input.policies());
        store.setBusinessType(input.businessType());store.setPhone(input.phone());store.setBusinessAddress(input.businessAddress());store.setRegistrationNumber(input.registrationNumber());store.setIdentityDocumentUrl(input.identityDocumentUrl());store.setBusinessDocumentUrl(input.businessDocumentUrl());store.setContactEmail(input.contactEmail());store.setWhatsappNumber(input.whatsappNumber());store.setOpeningHours(input.openingHours());store.setDeliveryPolicy(input.deliveryPolicy());store.setReturnPolicy(input.returnPolicy());store.setTermsAccepted(input.termsAccepted());store.setOnboardingSubmitted(input.submitOnboarding() && input.termsAccepted() && input.phone()!=null && !input.phone().isBlank() && input.businessAddress()!=null && !input.businessAddress().isBlank() && input.identityDocumentUrl()!=null && !input.identityDocumentUrl().isBlank());
        events.audit(seller,"SELLER_STORE_UPDATED","store="+store.getName()+", onboardingSubmitted="+store.isOnboardingSubmitted());
        return ResponseEntity.ok(stores.save(store));
    }

    @GetMapping("/orders")
    @Transactional
    public ResponseEntity<?> sellerOrders(Authentication authentication) {
        User seller = access.ownerForOrders(authentication == null ? null : users.findByEmail(authentication.getName()).orElse(null));
        if (seller == null) return ResponseEntity.status(403).build();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Order order : orders.findOrdersBySellerId(seller.getId())) {
            SellerFulfillment fulfillment = fulfillments.findByOrderAndSeller(order, seller).orElseGet(() -> {
                SellerFulfillment created = new SellerFulfillment(); created.setOrder(order); created.setSeller(seller);
                created.setStatus(order.getStatus() == OrderStatus.PENDING ? OrderStatus.PENDING : OrderStatus.PROCESSING);
                return fulfillments.save(created);
            });
            List<OrderItem> items = order.getItems().stream().filter(item -> belongsToSeller(item, seller)).toList();
            BigDecimal subtotal = items.stream().map(item -> item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("fulfillmentId", fulfillment.getId()); row.put("orderId", order.getId());
            row.put("createdAt", order.getCreatedAt());
            row.put("status", order.getStatus() == OrderStatus.CANCELLED ? OrderStatus.CANCELLED : fulfillment.getStatus());
            row.put("trackingNumber", fulfillment.getTrackingNumber()); row.put("subtotal", subtotal); row.put("items", items);
            result.add(row);
        }
        return ResponseEntity.ok(result);
    }

    @PatchMapping("/orders/{id}")
    @Transactional
    public ResponseEntity<?> update(Authentication authentication, @PathVariable Long id, @RequestBody FulfillmentInput input) {
        User actor = authentication == null ? null : users.findByEmail(authentication.getName()).orElse(null); SellerFulfillment fulfillment = fulfillments.findById(id).orElse(null);
        if (fulfillment == null || !access.canManageOrders(actor, fulfillment.getSeller())) return ResponseEntity.status(403).build();
        if (fulfillment.getOrder().getStatus() == OrderStatus.PENDING) return ResponseEntity.status(409).body("Le paiement doit être confirmé avant la préparation.");
        if (fulfillment.getOrder().getStatus() == OrderStatus.CANCELLED) return ResponseEntity.status(409).body("Une commande annulée ne peut pas être expédiée.");
        List<OrderStatus> allowed = List.of(OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED);
        if (input.status() == null || !allowed.contains(input.status())) return ResponseEntity.badRequest().body("Transition invalide.");
        if (input.status().ordinal() < fulfillment.getStatus().ordinal()) return ResponseEntity.status(409).body("Le statut ne peut pas revenir en arrière.");
        if (input.status() == OrderStatus.SHIPPED && (input.trackingNumber() == null || input.trackingNumber().isBlank())) return ResponseEntity.badRequest().body("Numéro de suivi requis.");
        fulfillment.setStatus(input.status()); fulfillment.setTrackingNumber(input.trackingNumber() == null ? null : input.trackingNumber().trim());
        events.audit(actor,"FULFILLMENT_UPDATED","fulfillment="+id+", status="+input.status());
        // L'acheteur ne voyait rien bouger : le statut du fulfillment change ici
        // sans toucher celui de la commande.
        Order commande = fulfillment.getOrder();
        if (input.status() == OrderStatus.SHIPPED)
            buyerNotifications.notify(commande.getBuyer(), "Commande expédiée",
                    "Votre commande #" + commande.getId() + " est en route"
                            + (fulfillment.getTrackingNumber() == null ? "." : " — suivi : " + fulfillment.getTrackingNumber() + "."),
                    "/orders/" + commande.getId());
        else if (input.status() == OrderStatus.DELIVERED)
            buyerNotifications.notify(commande.getBuyer(), "Commande livrée",
                    "Votre commande #" + commande.getId() + " a été livrée. Un souci ? Vous pouvez demander un retour.",
                    "/orders/" + commande.getId());
        SellerFulfillment enregistre = fulfillments.save(fulfillment);
        propagerStatutCommande(commande);
        // Renvoyer l'entite faisait echouer la serialisation sur ses proxys LAZY
        // (open-in-view=false) : l'expedition etait bien enregistree mais le
        // vendeur recevait une erreur. On renvoie les memes cles que
        // GET /seller/orders, que l'ecran fusionne dans sa ligne.
        Map<String,Object> vue = new LinkedHashMap<>();
        vue.put("fulfillmentId", enregistre.getId());
        vue.put("orderId", commande.getId());
        vue.put("status", enregistre.getStatus());
        vue.put("trackingNumber", enregistre.getTrackingNumber());
        return ResponseEntity.ok(vue);
    }

    @Transactional(readOnly = true)
    @GetMapping(value="/orders/export", produces="text/csv")
    public ResponseEntity<String> exportOrders(Authentication authentication) {
        User seller=access.ownerForOrders(authentication==null?null:users.findByEmail(authentication.getName()).orElse(null)); if(seller==null)return ResponseEntity.status(403).build();
        StringBuilder csv=new StringBuilder("commande,date,statut,suivi,produits,sous_total\n");
        for(Order order:orders.findOrdersBySellerId(seller.getId())) { SellerFulfillment f=fulfillments.findByOrderAndSeller(order,seller).orElse(null); String items=order.getItems().stream().filter(i->belongsToSeller(i,seller)).map(i->i.getProduct().getName()+" x"+i.getQuantity()).reduce((a,b)->a+" | "+b).orElse(""); BigDecimal total=order.getItems().stream().filter(i->belongsToSeller(i,seller)).map(i->i.getPrice().multiply(BigDecimal.valueOf(i.getQuantity()))).reduce(BigDecimal.ZERO,BigDecimal::add); csv.append(order.getId()).append(',').append(order.getCreatedAt()).append(',').append(f==null?order.getStatus():f.getStatus()).append(',').append(f==null?"":csvEscape(f.getTrackingNumber())).append(',').append(csvEscape(items)).append(',').append(total).append('\n'); }
        return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION,"attachment; filename=commandes-djibtout.csv").contentType(MediaType.parseMediaType("text/csv;charset=UTF-8")).body(csv.toString());
    }

    private String csvEscape(String value){return "\""+(value==null?"":value.replace("\"","\"\""))+"\"";}

    @Transactional(readOnly = true)
    @GetMapping(value="/returns/export", produces="text/csv")
    public ResponseEntity<String> exportReturns(Authentication authentication){User seller=access.ownerForOrders(authentication==null?null:users.findByEmail(authentication.getName()).orElse(null));if(seller==null)return ResponseEntity.status(403).build();StringBuilder csv=new StringBuilder("retour,date,produit,quantite,statut,motif,remboursement\n");for(ReturnRequest r:returnRequests.findBySellerOrderByCreatedAtDesc(seller))csv.append(r.getId()).append(',').append(r.getCreatedAt()).append(',').append(csvEscape(r.getOrderItem().getProduct().getName())).append(',').append(r.getQuantity()).append(',').append(r.getStatus()).append(',').append(csvEscape(r.getReason())).append(',').append(r.getRefundAmount()).append('\n');return csvResponse("retours-djibtout.csv",csv);}

    @Transactional(readOnly = true)
    @GetMapping(value="/analytics/export", produces="text/csv")
    public ResponseEntity<String> exportAnalytics(Authentication authentication,@RequestParam(defaultValue="30")int days){User seller=seller(authentication);if(seller==null)return ResponseEntity.status(403).build();int safe=Math.max(1,Math.min(days,365));LocalDateTime since=LocalDateTime.now().minusDays(safe);StringBuilder csv=new StringBuilder("produit,unites,chiffre_affaires\n");Map<String,Integer> units=new LinkedHashMap<>();Map<String,BigDecimal> revenue=new LinkedHashMap<>();for(Order o:orders.findOrdersBySellerId(seller.getId()))if(o.getCreatedAt()!=null&&o.getCreatedAt().isAfter(since)&&o.getStatus()!=OrderStatus.CANCELLED)for(OrderItem i:o.getItems())if(belongsToSeller(i,seller)){units.merge(i.getProduct().getName(),i.getQuantity(),Integer::sum);revenue.merge(i.getProduct().getName(),i.getPrice().multiply(BigDecimal.valueOf(i.getQuantity())),BigDecimal::add);}revenue.forEach((name,value)->csv.append(csvEscape(name)).append(',').append(units.get(name)).append(',').append(value).append('\n'));return csvResponse("statistiques-djibtout.csv",csv);}

    @GetMapping(value="/settlements/export", produces="text/csv")
    public ResponseEntity<String> exportSettlements(Authentication authentication){User seller=seller(authentication);if(seller==null)return ResponseEntity.status(403).build();StringBuilder csv=new StringBuilder("reglement,date,brut,commission,net,statut,date_paiement\n");for(SellerSettlement s:settlements.findBySellerOrderByCreatedAtDesc(seller))csv.append(s.getId()).append(',').append(s.getCreatedAt()).append(',').append(s.getGrossAmount()).append(',').append(s.getCommissionAmount()).append(',').append(s.getNetAmount()).append(',').append(s.getStatus()).append(',').append(s.getPaidAt()==null?"":s.getPaidAt()).append('\n');return csvResponse("reglements-djibtout.csv",csv);}

    private ResponseEntity<String> csvResponse(String filename,StringBuilder csv){return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION,"attachment; filename="+filename).contentType(MediaType.parseMediaType("text/csv;charset=UTF-8")).body(csv.toString());}

    @PostMapping("/products/import-csv")
    @Transactional
    public ResponseEntity<?> importProducts(Authentication authentication, @RequestParam("file") MultipartFile file) {
        User seller = seller(authentication);
        if (seller == null) return ResponseEntity.status(403).build();
        if (file.isEmpty() || file.getSize() > 2 * 1024 * 1024) return ResponseEntity.badRequest().body("Fichier CSV vide ou supérieur à 2 Mo.");
        List<String> errors = new ArrayList<>();
        List<Product> imported = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String header = reader.readLine();
            if (header == null) return ResponseEntity.badRequest().body("Le fichier est vide.");
            List<String> columns = parseCsv(header);
            Map<String, Integer> positions = new HashMap<>();
            for (int i = 0; i < columns.size(); i++) positions.put(columns.get(i).trim().toLowerCase(Locale.ROOT), i);
            for (String required : List.of("name", "description", "price", "stockquantity", "category"))
                if (!positions.containsKey(required)) return ResponseEntity.badRequest().body("Colonne obligatoire absente : " + required);
            String line; int lineNumber = 1;
            while ((line = reader.readLine()) != null) {
                lineNumber++;
                if (line.isBlank()) continue;
                try {
                    List<String> values = parseCsv(line);
                    Product product = new Product();
                    product.setName(csvValue(values, positions, "name"));
                    product.setDescription(csvValue(values, positions, "description"));
                    product.setPrice(new BigDecimal(csvValue(values, positions, "price")));
                    product.setStockQuantity(Integer.parseInt(csvValue(values, positions, "stockquantity")));
                    product.setCategory(csvValue(values, positions, "category"));
                    product.setBrand(csvOptional(values, positions, "brand"));
                    String image = csvOptional(values, positions, "imageurl");
                    if (image != null) product.setImages(List.of(image));
                    if (product.getName().isBlank() || product.getCategory().isBlank() || product.getPrice().signum() < 0 || product.getStockQuantity() < 0)
                        throw new IllegalArgumentException("valeurs invalides");
                    product.setSeller(seller);
                    imported.add(products.save(product));
                } catch (Exception exception) {
                    errors.add("Ligne " + lineNumber + " : " + exception.getMessage());
                }
                if (imported.size() + errors.size() >= 500) break;
            }
        } catch (Exception exception) {
            return ResponseEntity.badRequest().body("Lecture CSV impossible : " + exception.getMessage());
        }
        return ResponseEntity.ok(Map.of("imported", imported.size(), "rejected", errors.size(), "errors", errors.stream().limit(20).toList()));
    }

    @PostMapping("/products/import-xlsx")
    @Transactional
    public ResponseEntity<?> importProductsXlsx(Authentication authentication, @RequestParam("file") MultipartFile file) {
        User seller = seller(authentication);
        if (seller == null) return ResponseEntity.status(403).build();
        if (file.isEmpty() || file.getSize() > 5 * 1024 * 1024) return ResponseEntity.badRequest().body("Fichier XLSX vide ou supérieur à 5 Mo.");
        List<String> errors = new ArrayList<>(); int imported = 0;
        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getNumberOfSheets() == 0 ? null : workbook.getSheetAt(0);
            if (sheet == null || sheet.getPhysicalNumberOfRows() < 2) return ResponseEntity.badRequest().body("Le fichier est vide.");
            DataFormatter formatter = new DataFormatter(); Row header = sheet.getRow(sheet.getFirstRowNum()); Map<String,Integer> columns = new HashMap<>();
            for (Cell cell : header) columns.put(formatter.formatCellValue(cell).trim().toLowerCase(Locale.ROOT), cell.getColumnIndex());
            for (String required : List.of("name","description","price","stockquantity","category")) if (!columns.containsKey(required)) return ResponseEntity.badRequest().body("Colonne obligatoire absente : " + required);
            for (int rowIndex = header.getRowNum() + 1; rowIndex <= sheet.getLastRowNum() && imported + errors.size() < 500; rowIndex++) {
                Row row = sheet.getRow(rowIndex); if (row == null) continue;
                try { Product product = new Product();
                    product.setName(xlsxValue(row, columns, "name", formatter)); product.setDescription(xlsxValue(row, columns, "description", formatter));
                    product.setPrice(new BigDecimal(xlsxValue(row, columns, "price", formatter).replace(',', '.'))); product.setStockQuantity(Integer.parseInt(xlsxValue(row, columns, "stockquantity", formatter)));
                    product.setCategory(xlsxValue(row, columns, "category", formatter)); String brand=xlsxOptional(row,columns,"brand",formatter), image=xlsxOptional(row,columns,"imageurl",formatter);
                    product.setBrand(brand); if(image!=null)product.setImages(List.of(image)); product.setSeller(seller);
                    if(product.getPrice().signum()<0||product.getStockQuantity()<0)throw new IllegalArgumentException("prix ou stock invalide"); products.save(product); imported++;
                } catch (Exception exception) { errors.add("Ligne " + (rowIndex + 1) + " : " + exception.getMessage()); }
            }
        } catch (Exception exception) { return ResponseEntity.badRequest().body("Lecture XLSX impossible : " + exception.getMessage()); }
        return ResponseEntity.ok(Map.of("imported", imported, "rejected", errors.size(), "errors", errors.stream().limit(20).toList()));
    }

    private String xlsxValue(Row row, Map<String,Integer> columns, String key, DataFormatter formatter) { String value=xlsxOptional(row,columns,key,formatter); if(value==null)throw new IllegalArgumentException(key+" manquant"); return value; }
    private String xlsxOptional(Row row, Map<String,Integer> columns, String key, DataFormatter formatter) { Integer index=columns.get(key); if(index==null)return null; String value=formatter.formatCellValue(row.getCell(index, Row.MissingCellPolicy.CREATE_NULL_AS_BLANK)).trim(); return value.isBlank()?null:value; }

    private List<String> parseCsv(String line) {
        List<String> values = new ArrayList<>(); StringBuilder current = new StringBuilder(); boolean quoted = false;
        for (int i = 0; i < line.length(); i++) {
            char value = line.charAt(i);
            if (value == '"') {
                if (quoted && i + 1 < line.length() && line.charAt(i + 1) == '"') { current.append('"'); i++; }
                else quoted = !quoted;
            } else if (value == ',' && !quoted) { values.add(current.toString().trim()); current.setLength(0); }
            else current.append(value);
        }
        if (quoted) throw new IllegalArgumentException("guillemet non fermé");
        values.add(current.toString().trim()); return values;
    }

    private String csvValue(List<String> values, Map<String, Integer> positions, String name) {
        Integer index = positions.get(name);
        if (index == null || index >= values.size() || values.get(index).isBlank()) throw new IllegalArgumentException(name + " manquant");
        return values.get(index).trim();
    }

    private String csvOptional(List<String> values, Map<String, Integer> positions, String name) {
        Integer index = positions.get(name);
        return index == null || index >= values.size() || values.get(index).isBlank() ? null : values.get(index).trim();
    }

    /**
     * Reporte l'avancement des expeditions sur la commande elle-meme.
     *
     * Sans cela `Order.status` restait fige : l'acheteur voyait « en
     * preparation » indefiniment, ne pouvait jamais demander de retour
     * (ReturnController exige DELIVERED) ni publier d'avis (OwnershipService
     * s'appuie sur les achats livres). Deux fonctionnalites entieres etaient
     * inaccessibles.
     *
     * Une commande peut couvrir plusieurs vendeurs : elle n'avance que lorsque
     * chacun d'eux a une expedition, et prend alors le statut du plus en
     * retard. Les expeditions etant creees paresseusement a l'ouverture de
     * l'ecran vendeur, on compare aux vendeurs reels des articles et non au
     * nombre de lignes deja enregistrees.
     */
    private void propagerStatutCommande(Order commande) {
        Set<Long> vendeurs = commande.getItems().stream().map(OrderItem::getProduct)
                .map(Product::getSeller).filter(Objects::nonNull).map(User::getId)
                .collect(java.util.stream.Collectors.toSet());
        if (vendeurs.isEmpty()) return;
        List<SellerFulfillment> expeditions = fulfillments.findByOrder(commande);
        Set<Long> couverts = expeditions.stream().map(f -> f.getSeller().getId())
                .collect(java.util.stream.Collectors.toSet());
        if (!couverts.containsAll(vendeurs)) return;
        OrderStatus atteint = expeditions.stream().map(SellerFulfillment::getStatus)
                .min(Comparator.comparingInt(OrderStatus::ordinal)).orElse(null);
        // Jamais de retour en arriere, et une commande annulee reste annulee.
        if (atteint == null || atteint == OrderStatus.CANCELLED) return;
        if (commande.getStatus() == OrderStatus.CANCELLED) return;
        if (atteint.ordinal() <= commande.getStatus().ordinal()) return;
        commande.setStatus(atteint);
        orders.save(commande);
    }

    private boolean belongsToSeller(OrderItem item, User seller) {
        return item.getProduct().getSeller() != null && item.getProduct().getSeller().getId().equals(seller.getId());
    }

    public record StoreInput(@NotBlank @Size(max = 120) String name, @Size(max = 1000) String description,
                             String logoUrl, String bannerUrl, @Size(max = 1000) String policies,String businessType,String phone,@Size(max=500)String businessAddress,String registrationNumber,String identityDocumentUrl,String businessDocumentUrl,@Email String contactEmail,String whatsappNumber,@Size(max=1000)String openingHours,@Size(max=2000)String deliveryPolicy,@Size(max=2000)String returnPolicy,boolean termsAccepted,boolean submitOnboarding) {}
    public record FulfillmentInput(OrderStatus status, String trackingNumber) {}
}
