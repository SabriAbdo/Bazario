package com.bazario.repository;

import com.bazario.entity.Product;
import com.bazario.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {

    @Query("SELECT p FROM Product p WHERE p.deleted = false ORDER BY p.createdAt DESC")
    List<Product> findAllActive();

    @Query("SELECT p FROM Product p WHERE p.deleted = false AND p.approvedByAdmin = true ORDER BY p.createdAt DESC")
    List<Product> findAllActiveApproved();

    @Query(value = "SELECT p FROM Product p WHERE p.deleted = false",
           countQuery = "SELECT COUNT(p) FROM Product p WHERE p.deleted = false")
    Page<Product> findByDeletedFalse(Pageable pageable);

    @Query(value = "SELECT p FROM Product p WHERE p.deleted = false AND p.createdBy = :createdBy",
           countQuery = "SELECT COUNT(p) FROM Product p WHERE p.deleted = false AND p.createdBy = :createdBy")
    Page<Product> findByCreatedByAndDeletedFalse(@Param("createdBy") User createdBy, Pageable pageable);

    @Query(value = "SELECT p FROM Product p WHERE p.deleted = false AND p.createdBy = :createdBy AND (LOWER(p.libelle) LIKE LOWER(CONCAT('%',:q,'%')) OR LOWER(p.description) LIKE LOWER(CONCAT('%',:q,'%')))",
           countQuery = "SELECT COUNT(p) FROM Product p WHERE p.deleted = false AND p.createdBy = :createdBy AND (LOWER(p.libelle) LIKE LOWER(CONCAT('%',:q,'%')) OR LOWER(p.description) LIKE LOWER(CONCAT('%',:q,'%')))")
    Page<Product> searchByCreator(@Param("q") String q, @Param("createdBy") User createdBy, Pageable pageable);

    @Query("""
        SELECT p FROM Product p
        WHERE p.deleted = false
          AND (CAST(:q AS string) IS NULL OR LOWER(p.libelle) LIKE LOWER(CONCAT('%',CAST(:q AS string),'%')) OR LOWER(p.description) LIKE LOWER(CONCAT('%',CAST(:q AS string),'%')))
        """)
    Page<Product> searchProducts(@Param("q") String q, Pageable pageable);

    /** Public catalogue: only approved, active, non-deleted products */
    @Query(value = """
        SELECT p FROM Product p
        WHERE p.deleted = false
          AND p.approvedByAdmin = true
          AND (CAST(:q AS string) IS NULL OR LOWER(p.libelle) LIKE LOWER(CONCAT('%',CAST(:q AS string),'%')) OR LOWER(p.description) LIKE LOWER(CONCAT('%',CAST(:q AS string),'%')))
          AND (CAST(:categorie AS string) IS NULL OR p.categorie = CAST(:categorie AS string))
          AND (CAST(:marque AS string) IS NULL OR p.marque = CAST(:marque AS string))
          AND (:minPrix IS NULL OR p.prix >= :minPrix)
          AND (:maxPrix IS NULL OR p.prix <= :maxPrix)
        """,
        countQuery = """
        SELECT COUNT(p) FROM Product p
        WHERE p.deleted = false
          AND p.approvedByAdmin = true
          AND (CAST(:q AS string) IS NULL OR LOWER(p.libelle) LIKE LOWER(CONCAT('%',CAST(:q AS string),'%')) OR LOWER(p.description) LIKE LOWER(CONCAT('%',CAST(:q AS string),'%')))
          AND (CAST(:categorie AS string) IS NULL OR p.categorie = CAST(:categorie AS string))
          AND (CAST(:marque AS string) IS NULL OR p.marque = CAST(:marque AS string))
          AND (:minPrix IS NULL OR p.prix >= :minPrix)
          AND (:maxPrix IS NULL OR p.prix <= :maxPrix)
        """)
    Page<Product> filterProducts(
            @Param("q") String q,
            @Param("categorie") String categorie,
            @Param("marque") String marque,
            @Param("minPrix") BigDecimal minPrix,
            @Param("maxPrix") BigDecimal maxPrix,
            Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.deleted = true ORDER BY p.createdAt DESC")
    List<Product> findAllDeleted();

    @Query("SELECT p FROM Product p WHERE p.deleted = true AND p.createdBy = :createdBy ORDER BY p.createdAt DESC")
    List<Product> findDeletedByCreatedBy(@Param("createdBy") User createdBy);

    @Query(value = "SELECT p FROM Product p WHERE p.deleted = true",
           countQuery = "SELECT COUNT(p) FROM Product p WHERE p.deleted = true")
    Page<Product> findAllDeletedPaged(Pageable pageable);

    @Query(value = "SELECT p FROM Product p WHERE p.deleted = true AND p.createdBy = :createdBy",
           countQuery = "SELECT COUNT(p) FROM Product p WHERE p.deleted = true AND p.createdBy = :createdBy")
    Page<Product> findDeletedByCreatedByPaged(@Param("createdBy") User createdBy, Pageable pageable);

    /** All non-deleted products with approvedByAdmin = false (pending admin review) */
    @Query(value = "SELECT p FROM Product p WHERE p.deleted = false AND p.approvedByAdmin = false",
           countQuery = "SELECT COUNT(p) FROM Product p WHERE p.deleted = false AND p.approvedByAdmin = false")
    Page<Product> findPendingApproval(Pageable pageable);

    long countByDeletedFalseAndApprovedByAdminFalse();

    long countByDeletedFalseAndApprovedByAdminTrue();
}
