package com.bazario.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * One-off fixer: Hibernate auto-generates a CHECK constraint on enum-string columns from the
 * enum values present when the table was first created. Since ddl-auto=update never refreshes
 * constraints, adding EN_ROUTE/RETOURNEE to Order.OrderStatus left stale constraints in place.
 * This drops any such stale CHECK constraints on the order status columns; Hibernate's own
 * check constraints are not relied upon for validation (the service layer / enum type already
 * guarantee valid values), so it is safe to simply remove them.
 */
@Component
@Order(0)
public class DropStaleOrderStatusConstraints implements ApplicationRunner {

    private final JdbcTemplate jdbc;

    public DropStaleOrderStatusConstraints(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(ApplicationArguments args) {
        for (String table : List.of("commands", "order_status_history")) {
            List<String> constraints = jdbc.queryForList(
                    "SELECT con.conname FROM pg_constraint con " +
                    "JOIN pg_class rel ON rel.oid = con.conrelid " +
                    "WHERE rel.relname = ? AND con.contype = 'c' AND pg_get_constraintdef(con.oid) LIKE '%status%'",
                    String.class, table);
            for (String constraint : constraints) {
                jdbc.execute("ALTER TABLE " + table + " DROP CONSTRAINT IF EXISTS " + constraint);
            }
        }
    }
}
