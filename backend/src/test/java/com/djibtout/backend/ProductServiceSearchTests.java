package com.djibtout.backend;
import com.djibtout.backend.repository.ProductRepository;import com.djibtout.backend.service.ProductService;
import org.junit.jupiter.api.Test;import org.mockito.ArgumentCaptor;import org.springframework.data.domain.Page;import org.springframework.data.domain.PageImpl;import org.springframework.data.domain.Pageable;
import static org.junit.jupiter.api.Assertions.*;import static org.mockito.ArgumentMatchers.*;import static org.mockito.Mockito.*;

class ProductServiceSearchTests{
 ProductRepository products=mock(ProductRepository.class);
 ProductService service=new ProductService(products);

 @Test void oversizedPageSizeIsClampedInsteadOfLettingClientsDumpTheWholeCatalog(){
  when(products.searchProducts(any(),any(),any(),any(),any(),any(),any(),any(),any(),any())).thenReturn(Page.empty());
  service.searchProducts(null,null,null,null,null,null,null,null,null,null,0,1_000_000);
  ArgumentCaptor<Pageable> captor=ArgumentCaptor.forClass(Pageable.class);
  verify(products).searchProducts(any(),any(),any(),any(),any(),any(),any(),any(),any(),captor.capture());
  assertEquals(60,captor.getValue().getPageSize());
 }

 @Test void negativePageIsClampedToZero(){
  when(products.searchProducts(any(),any(),any(),any(),any(),any(),any(),any(),any(),any())).thenReturn(Page.empty());
  service.searchProducts(null,null,null,null,null,null,null,null,null,null,-5,12);
  ArgumentCaptor<Pageable> captor=ArgumentCaptor.forClass(Pageable.class);
  verify(products).searchProducts(any(),any(),any(),any(),any(),any(),any(),any(),any(),captor.capture());
  assertEquals(0,captor.getValue().getPageNumber());
 }

 @Test void zeroOrNegativeSizeIsClampedToOne(){
  when(products.searchProducts(any(),any(),any(),any(),any(),any(),any(),any(),any(),any())).thenReturn(Page.empty());
  service.searchProducts(null,null,null,null,null,null,null,null,null,null,0,0);
  ArgumentCaptor<Pageable> captor=ArgumentCaptor.forClass(Pageable.class);
  verify(products).searchProducts(any(),any(),any(),any(),any(),any(),any(),any(),any(),captor.capture());
  assertEquals(1,captor.getValue().getPageSize());
 }

 @Test void priceAscSortIsMappedToPriceField(){
  when(products.searchProducts(any(),any(),any(),any(),any(),any(),any(),any(),any(),any())).thenReturn(Page.empty());
  service.searchProducts(null,null,null,null,null,null,null,null,null,"price_asc",0,12);
  ArgumentCaptor<Pageable> captor=ArgumentCaptor.forClass(Pageable.class);
  verify(products).searchProducts(any(),any(),any(),any(),any(),any(),any(),any(),any(),captor.capture());
  var order=captor.getValue().getSort().getOrderFor("price");
  assertNotNull(order);
  assertTrue(order.isAscending());
 }

 @Test void unknownSortFallsBackToNewestById(){
  when(products.searchProducts(any(),any(),any(),any(),any(),any(),any(),any(),any(),any())).thenReturn(Page.empty());
  service.searchProducts(null,null,null,null,null,null,null,null,null,"not-a-real-sort",0,12);
  ArgumentCaptor<Pageable> captor=ArgumentCaptor.forClass(Pageable.class);
  verify(products).searchProducts(any(),any(),any(),any(),any(),any(),any(),any(),any(),captor.capture());
  var order=captor.getValue().getSort().getOrderFor("id");
  assertNotNull(order);
  assertTrue(order.isDescending());
 }
}
