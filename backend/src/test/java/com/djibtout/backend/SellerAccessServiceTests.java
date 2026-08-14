package com.djibtout.backend;
import com.djibtout.backend.entity.*;import com.djibtout.backend.repository.SellerStaffRepository;import com.djibtout.backend.service.SellerAccessService;
import org.junit.jupiter.api.Test;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;import static org.mockito.Mockito.*;

class SellerAccessServiceTests{
 SellerStaffRepository staffRepo=mock(SellerStaffRepository.class);
 SellerAccessService access=new SellerAccessService(staffRepo);

 User user(long id){User u=new User();u.setId(id);u.setRole(Role.BUYER);return u;}
 Product productOf(User seller){Product p=new Product();p.setSeller(seller);return p;}
 SellerStaff staff(User user,SellerStore store,SellerStaffRole role){SellerStaff s=new SellerStaff();s.setUser(user);s.setStore(store);s.setStaffRole(role);return s;}
 SellerStore storeOf(User seller){SellerStore s=new SellerStore();s.setSeller(seller);return s;}

 @Test void ownerCanManageOwnCatalog(){
  User seller=user(1);seller.setRole(Role.SELLER);
  assertTrue(access.canManageCatalog(seller,productOf(seller)));
 }

 @Test void adminCanManageAnyCatalog(){
  User admin=user(1);admin.setRole(Role.ADMIN);
  User seller=user(2);
  assertTrue(access.canManageCatalog(admin,productOf(seller)));
 }

 @Test void unrelatedSellerCannotManageAnotherSellersCatalog(){
  User seller=user(1);seller.setRole(Role.SELLER);
  User otherSeller=user(2);
  when(staffRepo.findByUser(seller)).thenReturn(List.of());
  assertFalse(access.canManageCatalog(seller,productOf(otherSeller)));
 }

 @Test void staffWithCatalogManagerRoleCanManageCatalogButNotOrders(){
  User seller=user(1);User staffUser=user(2);
  SellerStore store=storeOf(seller);
  when(staffRepo.findByUser(staffUser)).thenReturn(List.of(staff(staffUser,store,SellerStaffRole.CATALOG_MANAGER)));
  assertTrue(access.canManageCatalog(staffUser,productOf(seller)));
  assertFalse(access.canManageOrders(staffUser,seller));
 }

 @Test void staffWithOrderManagerRoleCanManageOrdersButNotCatalog(){
  User seller=user(1);User staffUser=user(2);
  SellerStore store=storeOf(seller);
  when(staffRepo.findByUser(staffUser)).thenReturn(List.of(staff(staffUser,store,SellerStaffRole.ORDER_MANAGER)));
  assertTrue(access.canManageOrders(staffUser,seller));
  assertFalse(access.canManageCatalog(staffUser,productOf(seller)));
 }

 @Test void storeManagerCanManageBothCatalogAndOrders(){
  User seller=user(1);User staffUser=user(2);
  SellerStore store=storeOf(seller);
  when(staffRepo.findByUser(staffUser)).thenReturn(List.of(staff(staffUser,store,SellerStaffRole.STORE_MANAGER)));
  assertTrue(access.canManageOrders(staffUser,seller));
  assertTrue(access.canManageCatalog(staffUser,productOf(seller)));
 }

 @Test void staffOfADifferentStoreCannotCrossOverToAnotherSellersStore(){
  User sellerA=user(1);User sellerB=user(3);User staffOfA=user(2);
  SellerStore storeA=storeOf(sellerA);
  when(staffRepo.findByUser(staffOfA)).thenReturn(List.of(staff(staffOfA,storeA,SellerStaffRole.STORE_MANAGER)));
  assertFalse(access.canManageOrders(staffOfA,sellerB));
  assertFalse(access.canManageCatalog(staffOfA,productOf(sellerB)));
 }

 @Test void nullUserNeverHasAccess(){
  User seller=user(1);
  assertFalse(access.canManageCatalog(null,productOf(seller)));
  assertFalse(access.canManageOrders(null,seller));
  assertFalse(access.canSupport(null,seller));
 }

 @Test void ownerForOrdersResolvesStaffToTheirSellersAccount(){
  User seller=user(1);User staffUser=user(2);
  SellerStore store=storeOf(seller);
  when(staffRepo.findByUser(staffUser)).thenReturn(List.of(staff(staffUser,store,SellerStaffRole.ORDER_MANAGER)));
  assertEquals(seller,access.ownerForOrders(staffUser));
 }

 @Test void ownerForOrdersReturnsNullForStaffWithoutOrderPermission(){
  User seller=user(1);User staffUser=user(2);
  SellerStore store=storeOf(seller);
  when(staffRepo.findByUser(staffUser)).thenReturn(List.of(staff(staffUser,store,SellerStaffRole.CATALOG_MANAGER)));
  assertNull(access.ownerForOrders(staffUser));
 }
}
