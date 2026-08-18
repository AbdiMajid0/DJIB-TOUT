package com.djibtout.backend.service;
import org.springframework.stereotype.Service;
import javax.imageio.ImageIO;
import java.awt.Image;import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;import java.io.ByteArrayOutputStream;import java.io.IOException;
import java.util.LinkedHashMap;import java.util.Map;import java.util.Set;

@Service
public class ImageVariantService {
 private static final org.slf4j.Logger log=org.slf4j.LoggerFactory.getLogger(ImageVariantService.class);
 private static final Set<String> RESIZABLE_TYPES=Set.of("image/jpeg","image/png");
 private static final Map<String,Integer> VARIANT_MAX_WIDTH=Map.of("thumbnail",320,"medium",1024);

 public Map<String,byte[]> generateVariants(byte[] original,String contentType){
  Map<String,byte[]> variants=new LinkedHashMap<>();
  if(!RESIZABLE_TYPES.contains(contentType))return variants;
  BufferedImage source;
  // Un original illisible ou une ecriture impossible ne fait pas echouer
  // l'upload : l'image d'origine est deja stockee, seules les vignettes
  // manquent. Le defaut est journalise, sinon la disparition silencieuse des
  // vignettes n'est visible que sur les ecrans qui les affichent.
  try{source=ImageIO.read(new ByteArrayInputStream(original));}catch(IOException e){log.warn("Original {} illisible : aucune vignette generee.",contentType,e);return variants;}
  if(source==null||source.getWidth()<=0||source.getHeight()<=0)return variants;
  String formatName="image/png".equals(contentType)?"png":"jpg";
  for(Map.Entry<String,Integer> entry:VARIANT_MAX_WIDTH.entrySet()){
   int maxWidth=entry.getValue();
   if(source.getWidth()<=maxWidth)continue;
   byte[] resized=resize(source,maxWidth,formatName);
   if(resized!=null)variants.put(entry.getKey(),resized);
  }
  return variants;
 }

 private byte[] resize(BufferedImage source,int maxWidth,String formatName){
  int targetWidth=maxWidth;
  int targetHeight=Math.max(1,Math.round(((float)source.getHeight()/source.getWidth())*targetWidth));
  Image scaled=source.getScaledInstance(targetWidth,targetHeight,Image.SCALE_SMOOTH);
  BufferedImage output=new BufferedImage(targetWidth,targetHeight,"png".equals(formatName)?BufferedImage.TYPE_INT_ARGB:BufferedImage.TYPE_INT_RGB);
  var graphics=output.createGraphics();
  try{graphics.drawImage(scaled,0,0,null);}finally{graphics.dispose();}
  try{
   ByteArrayOutputStream out=new ByteArrayOutputStream();
   if(!ImageIO.write(output,formatName,out))return null;
   return out.toByteArray();
  }catch(IOException e){log.warn("Ecriture de la vignette {} px impossible.",maxWidth,e);return null;}
 }
}
