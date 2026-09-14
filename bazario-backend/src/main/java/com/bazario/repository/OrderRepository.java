package com.bazario.repository;

import com.bazario.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {

    Page<Order> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<Order> findByStatus(Order.OrderStatus status, Pageable pageable);

    @Query("SELECT o FROM Order o WHERE LOWER(o.nom) LIKE LOWER(CONCAT('%',:q,'%')) OR LOWER(o.prenom) LIKE LOWER(CONCAT('%',:q,'%')) OR o.telephone LIKE CONCAT('%',:q,'%')")
    Page<Order> searchOrdersPaged(@Param("q") String q, Pageable pageable);

    @Query("SELECT o FROM Order o WHERE LOWER(o.nom) LIKE LOWER(CONCAT('%',:q,'%')) OR LOWER(o.prenom) LIKE LOWER(CONCAT('%',:q,'%')) OR o.telephone LIKE CONCAT('%',:q,'%')")
    List<Order> searchOrders(@Param("q") String q);

    long countByStatus(Order.OrderStatus status);

    Page<Order> findByStatusNot(Order.OrderStatus status, Pageable pageable);

    @Query("SELECT o FROM Order o WHERE o.status != :status AND (LOWER(o.nom) LIKE LOWER(CONCAT('%',:q,'%')) OR LOWER(o.prenom) LIKE LOWER(CONCAT('%',:q,'%')) OR o.telephone LIKE CONCAT('%',:q,'%'))")
    Page<Order> searchHistorique(@Param("q") String q, @Param("status") Order.OrderStatus status, Pageable pageable);

    Page<Order> findByStatusIn(List<Order.OrderStatus> statuses, Pageable pageable);

    @Query("SELECT o FROM Order o WHERE o.status IN :statuses AND (LOWER(o.nom) LIKE LOWER(CONCAT('%',:q,'%')) OR LOWER(o.prenom) LIKE LOWER(CONCAT('%',:q,'%')) OR o.telephone LIKE CONCAT('%',:q,'%'))")
    Page<Order> searchByStatuses(@Param("q") String q, @Param("statuses") List<Order.OrderStatus> statuses, Pageable pageable);

    @Query("SELECT o FROM Order o WHERE o.status = :status AND (LOWER(o.nom) LIKE LOWER(CONCAT('%',:q,'%')) OR LOWER(o.prenom) LIKE LOWER(CONCAT('%',:q,'%')) OR o.telephone LIKE CONCAT('%',:q,'%'))")
    Page<Order> searchByStatus(@Param("q") String q, @Param("status") Order.OrderStatus status, Pageable pageable);
}
