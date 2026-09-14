package com.bazario.repository;

import com.bazario.entity.Order;
import com.bazario.entity.OrderItem;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    /** Product ids ranked by total quantity sold across non-cancelled/refused orders */
    @Query("""
        SELECT oi.productId FROM OrderItem oi
        WHERE oi.order.status <> :cancelled
          AND oi.order.status <> :refused
          AND oi.productId IS NOT NULL
        GROUP BY oi.productId
        ORDER BY SUM(oi.quantite) DESC
        """)
    List<Long> findBestSellingProductIds(
            @Param("cancelled") Order.OrderStatus cancelled,
            @Param("refused") Order.OrderStatus refused,
            Pageable pageable);
}
