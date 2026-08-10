package com.djibtout.backend.service;
import com.djibtout.backend.entity.*;import com.djibtout.backend.repository.OrderRepository;import org.springframework.stereotype.Service;
@Service public class OwnershipService{
 private final OrderRepository orders;public OwnershipService(OrderRepository orders){this.orders=orders;}
 public boolean ownsOrder(User user,Order order){return user!=null&&order!=null&&order.getBuyer().getId().equals(user.getId());}
 public boolean canViewOrder(User user,Order order){if(user==null||order==null)return false;if(user.getRole()==Role.ADMIN||ownsOrder(user,order))return true;return order.getItems().stream().anyMatch(i->i.getProduct().getSeller()!=null&&i.getProduct().getSeller().getId().equals(user.getId()));}
 public boolean purchasedProduct(User user,Product product){return user!=null&&product!=null&&orders.existsDeliveredPurchase(user.getId(),product.getId());}
}
