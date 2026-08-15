package com.djibtout.backend;

import com.djibtout.backend.entity.HomeSection;
import com.djibtout.backend.repository.HomeSectionRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.util.List;

// Donnees de demonstration : ce composant ne doit jamais s'executer
// ailleurs qu'en developpement. Sans cette restriction il creait un
// compte vendeur au mot de passe connu dans toute base vide, production
// comprise.
@Component @org.springframework.context.annotation.Profile("local")
public class HomeSectionSeeder implements CommandLineRunner {
    private final HomeSectionRepository repository;
    public HomeSectionSeeder(HomeSectionRepository repository){this.repository=repository;}

    @Override public void run(String... args){
        List<HomeSection> defaults=List.of(
            section("hero","À la une","Les campagnes du moment",14,0),
            section("shortcuts","Services rapides","Les raccourcis utiles",6,1),
            section("categories","Catégories populaires","Explorez le catalogue",10,2),
            section("campaigns","Campagnes DjibTout","Nos sélections du moment",3,3),
            section("popular","Produits populaires","Les produits qui attirent le plus nos clients",10,4),
            section("best_sellers","Meilleures ventes","Les produits réellement les plus commandés",10,5),
            section("limited_offers","Offres limitées","Des réductions réelles pour une durée limitée",10,6),
            section("newest","Nouveautés","Fraîchement ajoutés au catalogue",10,7),
            section("category_selections","Sélections par catégorie","Découvrez chaque univers",10,8),
            section("recently_viewed","Récemment consultés","Reprenez là où vous vous êtes arrêté",10,9),
            section("recommended","Recommandés pour vous","Selon les catégories que vous consultez",10,10),
            section("brands","Marques populaires","Les marques présentes sur DjibTout",6,11),
            section("seo","Acheter en ligne à Djibouti","Découvrez le catalogue DjibTout",1,12),
            section("faq","Questions fréquentes","Tout savoir avant de commander",6,13)
        );
        defaults.stream().filter(item->repository.findByKey(item.getKey()).isEmpty()).forEach(repository::save);
    }

    private HomeSection section(String key,String title,String subtitle,int max,int order){
        HomeSection section=new HomeSection();section.setKey(key);section.setTitle(title);section.setSubtitle(subtitle);
        section.setMaxItems(max);section.setDisplayOrder(order);return section;
    }
}
