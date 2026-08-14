package com.djibtout.backend;
import com.djibtout.backend.service.ImageVariantService;import org.junit.jupiter.api.Test;
import javax.imageio.ImageIO;import java.awt.image.BufferedImage;import java.io.ByteArrayInputStream;import java.io.ByteArrayOutputStream;import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;

class ImageVariantServiceTests{
 ImageVariantService service=new ImageVariantService();

 static byte[] image(int width,int height,String format){
  try{
   BufferedImage img=new BufferedImage(width,height,"png".equals(format)?BufferedImage.TYPE_INT_ARGB:BufferedImage.TYPE_INT_RGB);
   var g=img.createGraphics();g.fillRect(0,0,width,height);g.dispose();
   ByteArrayOutputStream out=new ByteArrayOutputStream();
   ImageIO.write(img,format,out);
   return out.toByteArray();
  }catch(Exception e){throw new IllegalStateException(e);}
 }

 @Test void largeJpegProducesThumbnailAndMediumSmallerThanMaxWidth()throws Exception{
  Map<String,byte[]> variants=service.generateVariants(image(1200,800,"jpg"),"image/jpeg");
  assertTrue(variants.containsKey("thumbnail"));
  assertTrue(variants.containsKey("medium"));
  BufferedImage thumb=ImageIO.read(new ByteArrayInputStream(variants.get("thumbnail")));
  BufferedImage medium=ImageIO.read(new ByteArrayInputStream(variants.get("medium")));
  assertEquals(320,thumb.getWidth());
  assertEquals(1024,medium.getWidth());
  assertEquals(Math.round(800.0*320/1200),thumb.getHeight());
 }

 @Test void smallJpegIsNotUpscaled(){
  Map<String,byte[]> variants=service.generateVariants(image(200,150,"jpg"),"image/jpeg");
  assertTrue(variants.isEmpty());
 }

 @Test void pngBetweenThresholdsOnlyProducesThumbnail(){
  Map<String,byte[]> variants=service.generateVariants(image(400,300,"png"),"image/png");
  assertTrue(variants.containsKey("thumbnail"));
  assertFalse(variants.containsKey("medium"));
 }

 @Test void unsupportedContentTypeProducesNoVariants(){
  Map<String,byte[]> variants=service.generateVariants(new byte[]{1,2,3,4},"image/webp");
  assertTrue(variants.isEmpty());
 }

 @Test void unreadableBytesProduceNoVariantsWithoutThrowing(){
  Map<String,byte[]> variants=service.generateVariants(new byte[]{1,2,3,4},"image/jpeg");
  assertTrue(variants.isEmpty());
 }
}
