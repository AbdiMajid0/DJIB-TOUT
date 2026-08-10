package com.djibtout.backend.controller;
import com.djibtout.backend.entity.*;import com.djibtout.backend.repository.*;import org.springframework.data.domain.PageRequest;import org.springframework.web.bind.annotation.*;import java.time.LocalDateTime;import java.util.*;
@RestController @RequestMapping("/api/catalog") public class CatalogController{
 private final ProductRepository products;private final CampaignRepository campaigns;private final HomeSectionRepository sections;
 public CatalogController(ProductRepository p,CampaignRepository c,HomeSectionRepository s){products=p;campaigns=c;sections=s;}
 @GetMapping("/metadata") public Metadata metadata(){return new Metadata(products.categoryCounts().stream().map(x->new Facet((String)x[0],((Number)x[1]).longValue())).toList(),products.brandCounts().stream().map(x->new Facet((String)x[0],((Number)x[1]).longValue())).toList(),products.sellerCounts().stream().map(x->new SellerFacet(((Number)x[0]).longValue(),(String)x[1],((Number)x[2]).longValue())).toList());}
 @GetMapping("/campaigns") public List<Campaign> campaigns(){LocalDateTime now=LocalDateTime.now();return campaigns.findByActiveTrueOrderByDisplayOrderAsc().stream().filter(c->(c.getStartsAt()==null||!c.getStartsAt().isAfter(now))&&(c.getEndsAt()==null||c.getEndsAt().isAfter(now))).toList();}
 @GetMapping("/best-sellers") public List<Product> bestSellers(@RequestParam(defaultValue="10") int limit){return products.findBestSellers(PageRequest.of(0,Math.max(1,Math.min(limit,30))));}
 @GetMapping("/home-sections") public List<HomeSection> homeSections(){return sections.findByActiveTrueOrderByDisplayOrderAsc();}
 public record Facet(String value,long count){}public record SellerFacet(long id,String name,long count){}public record Metadata(List<Facet> categories,List<Facet> brands,List<SellerFacet> sellers){}
}
