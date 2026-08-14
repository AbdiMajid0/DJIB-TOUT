package com.djibtout.backend;
import com.djibtout.backend.controller.FileUploadController;import com.djibtout.backend.service.ImageVariantService;import com.djibtout.backend.service.MediaStorage;
import org.junit.jupiter.api.Test;import org.springframework.http.ResponseEntity;import org.springframework.mock.web.MockMultipartFile;
import javax.imageio.ImageIO;import java.awt.image.BufferedImage;import java.io.ByteArrayOutputStream;
import static org.junit.jupiter.api.Assertions.*;

class FileUploadControllerTests{
 MediaStorage storage=(content,name,type)->"http://media.test/"+name;
 FileUploadController controller=new FileUploadController(storage,new ImageVariantService());

 static byte[] jpeg(int width,int height)throws Exception{
  BufferedImage img=new BufferedImage(width,height,BufferedImage.TYPE_INT_RGB);
  var g=img.createGraphics();g.fillRect(0,0,width,height);g.dispose();
  ByteArrayOutputStream out=new ByteArrayOutputStream();ImageIO.write(img,"jpg",out);return out.toByteArray();
 }

 @Test void largeImageUploadReturnsOriginalAndBothVariantUrls()throws Exception{
  MockMultipartFile file=new MockMultipartFile("file","photo.jpg","image/jpeg",jpeg(1200,800));
  ResponseEntity<?> response=controller.uploadFile(file);
  assertEquals(200,response.getStatusCode().value());
  FileUploadController.UploadResult body=(FileUploadController.UploadResult)response.getBody();
  assertNotNull(body.url());
  assertNotNull(body.thumbnailUrl());
  assertNotNull(body.mediumUrl());
  assertTrue(body.url().contains(".jpg"));
  assertTrue(body.thumbnailUrl().contains("-thumbnail.jpg"));
  assertTrue(body.mediumUrl().contains("-medium.jpg"));
 }

 @Test void smallImageUploadHasNoVariantUrls()throws Exception{
  MockMultipartFile file=new MockMultipartFile("file","photo.jpg","image/jpeg",jpeg(100,80));
  ResponseEntity<?> response=controller.uploadFile(file);
  FileUploadController.UploadResult body=(FileUploadController.UploadResult)response.getBody();
  assertNotNull(body.url());
  assertNull(body.thumbnailUrl());
  assertNull(body.mediumUrl());
 }

 @Test void wrongMimeTypeIsRejected(){
  MockMultipartFile file=new MockMultipartFile("file","photo.txt","text/plain","hello".getBytes());
  ResponseEntity<?> response=controller.uploadFile(file);
  assertEquals(400,response.getStatusCode().value());
 }

 @Test void mismatchedExtensionIsRejected()throws Exception{
  MockMultipartFile file=new MockMultipartFile("file","photo.png","image/jpeg",jpeg(400,300));
  ResponseEntity<?> response=controller.uploadFile(file);
  assertEquals(400,response.getStatusCode().value());
 }

 @Test void emptyFileIsRejected(){
  MockMultipartFile file=new MockMultipartFile("file","photo.jpg","image/jpeg",new byte[0]);
  ResponseEntity<?> response=controller.uploadFile(file);
  assertEquals(400,response.getStatusCode().value());
 }
}
