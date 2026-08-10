package com.djibtout.backend.service;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;import org.springframework.stereotype.Service;import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import java.nio.file.*;
@Service @ConditionalOnProperty(name="app.media.storage",havingValue="local",matchIfMissing=true) public class LocalMediaStorage implements MediaStorage{
 private final Path root=Paths.get("uploads").toAbsolutePath().normalize();public LocalMediaStorage(){try{Files.createDirectories(root);}catch(Exception e){throw new IllegalStateException("Stockage média indisponible.",e);}}
 public String store(byte[]content,String name,String type){try{Path target=root.resolve(name).normalize();if(!target.startsWith(root))throw new IllegalArgumentException("Chemin média invalide");Files.write(target,content,StandardOpenOption.CREATE_NEW);return ServletUriComponentsBuilder.fromCurrentContextPath().path("/uploads/").path(name).toUriString();}catch(Exception e){throw new IllegalStateException("Impossible de stocker le média.",e);}}
}
