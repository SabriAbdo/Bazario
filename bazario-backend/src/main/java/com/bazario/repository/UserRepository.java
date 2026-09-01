package com.bazario.repository;

import com.bazario.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);

    @Query("SELECT u FROM User u WHERE u.deleted = false AND (LOWER(u.fullName) LIKE LOWER(CONCAT('%',:q,'%')) OR LOWER(u.username) LIKE LOWER(CONCAT('%',:q,'%')))")
    List<User> searchUsers(@Param("q") String q);

    @Query(value = "SELECT u FROM User u WHERE u.deleted = false AND (LOWER(u.fullName) LIKE LOWER(CONCAT('%',:q,'%')) OR LOWER(u.username) LIKE LOWER(CONCAT('%',:q,'%')))",
           countQuery = "SELECT COUNT(u) FROM User u WHERE u.deleted = false AND (LOWER(u.fullName) LIKE LOWER(CONCAT('%',:q,'%')) OR LOWER(u.username) LIKE LOWER(CONCAT('%',:q,'%')))")
    Page<User> searchUsersPaged(@Param("q") String q, Pageable pageable);

    @Query(value = "SELECT u FROM User u WHERE u.deleted = false",
           countQuery = "SELECT COUNT(u) FROM User u WHERE u.deleted = false")
    Page<User> findAllActive(Pageable pageable);

    @Query("SELECT u FROM User u WHERE u.deleted = false")
    List<User> findAllByDeletedFalse();

    long countByDeletedFalseAndActiveFalse();

    long countByDeletedFalse();
}
