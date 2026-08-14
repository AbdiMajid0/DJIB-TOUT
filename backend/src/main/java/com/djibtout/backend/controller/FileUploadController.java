package com.djibtout.backend.controller;
import com.djibtout.backend.service.ImageVariantService;import com.djibtout.backend.service.MediaStorage;import org.springframework.http.ResponseEntity;import org.springframework.web.bind.annotation.*;import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;import java.nio.charset.StandardCharsets;import java.util.*;
@RestController @RequestMapping("/api/upload") public class FileUploadController{
 private static final long MAX_IMAGE=5*1024*1024,MAX_VIDEO=25*1024*1024;
 private static final Map<String,Set<String>> EXT=Map.of("image/jpeg",Set.of("jpg","jpeg"),"image/png",Set.of("png"),"image/webp",Set.of("webp"),"image/gif",Set.of("gif"),"video/mp4",Set.of("mp4"),"video/webm",Set.of("webm"));
 private final MediaStorage storage;private final ImageVariantService variants;public FileUploadController(MediaStorage storage,ImageVariantService variants){this.storage=storage;this.variants=variants;}
 @PostMapping public ResponseEntity<?> uploadFile(@RequestParam("file")MultipartFile file){
  if(file.isEmpty())return ResponseEntity.badRequest().body("Fichier vide.");String type=file.getContentType();if(type==null||!EXT.containsKey(type))return ResponseEntity.badRequest().body("Format non autorisé.");
  if(file.getSize()>(type.startsWith("video/")?MAX_VIDEO:MAX_IMAGE))return ResponseEntity.badRequest().body("Fichier trop volumineux.");String original=Optional.ofNullable(file.getOriginalFilename()).orElse("");int dot=original.lastIndexOf('.');String extension=dot<0?"":original.substring(dot+1).toLowerCase(Locale.ROOT);if(!EXT.get(type).contains(extension))return ResponseEntity.badRequest().body("Extension incompatible avec le type MIME.");
  try{
   byte[] bytes=file.getBytes();if(!signature(bytes,type))return ResponseEntity.badRequest().body("Signature de fichier invalide.");
   String base=UUID.randomUUID().toString();String ext=canonicalExtension(type);
   String url=storage.store(bytes,base+ext,type);
   String thumbnailUrl=null,mediumUrl=null;
   for(Map.Entry<String,byte[]> variant:variants.generateVariants(bytes,type).entrySet()){
    String variantUrl=storage.store(variant.getValue(),base+"-"+variant.getKey()+ext,type);
    if("thumbnail".equals(variant.getKey()))thumbnailUrl=variantUrl;else if("medium".equals(variant.getKey()))mediumUrl=variantUrl;
   }
   return ResponseEntity.ok(new UploadResult(url,thumbnailUrl,mediumUrl));
  }catch(IOException e){throw new IllegalStateException("Impossible de lire le média.",e);}
 }
 public record UploadResult(String url,String thumbnailUrl,String mediumUrl){}
 private String canonicalExtension(String t){return switch(t){case"image/jpeg"->".jpg";case"image/png"->".png";case"image/webp"->".webp";case"image/gif"->".gif";case"video/mp4"->".mp4";default->".webm";};}
 private boolean signature(byte[]b,String t){if(b.length<12)return false;return switch(t){case"image/jpeg"->u(b[0])==255&&u(b[1])==216&&u(b[2])==255;case"image/png"->u(b[0])==137&&b[1]==80&&b[2]==78&&b[3]==71&&b[4]==13&&b[5]==10&&b[6]==26&&b[7]==10;case"image/gif"->new String(b,0,6,StandardCharsets.US_ASCII).matches("GIF8[79]a");case"image/webp"->ascii(b,0,"RIFF")&&ascii(b,8,"WEBP");case"video/mp4"->ascii(b,4,"ftyp");case"video/webm"->u(b[0])==26&&u(b[1])==69&&u(b[2])==223&&u(b[3])==163;default->false;};}
 private int u(byte b){return b&255;}private boolean ascii(byte[]b,int o,String s){if(b.length<o+s.length())return false;for(int i=0;i<s.length();i++)if(b[o+i]!=(byte)s.charAt(i))return false;return true;}
}
