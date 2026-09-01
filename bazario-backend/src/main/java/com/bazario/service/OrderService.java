package com.bazario.service;

import com.bazario.dto.OrderDto;
import com.bazario.entity.Order;
import com.bazario.entity.OrderItem;
import com.bazario.entity.OrderStatusHistory;
import com.bazario.entity.Product;
import com.bazario.entity.User;
import com.bazario.exception.BadRequestException;
import com.bazario.exception.ResourceNotFoundException;
import com.bazario.repository.OrderRepository;
import com.bazario.repository.ProductRepository;
import com.bazario.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @Transactional
    public OrderDto.Response placeDemandeInfo(OrderDto.DemandeInfoRequest req) {
        Order order = Order.builder()
                .nom(req.nom())
                .prenom(req.prenom())
                .telephone(req.telephone())
                .email(req.email())
                .type(Order.OrderType.DEMANDE_INFO)
                .status(Order.OrderStatus.EN_ATTENTE)
                .build();
        addHistoryEntry(order, Order.OrderStatus.EN_ATTENTE, null);
        return toDto(orderRepository.save(order));
    }

    @Transactional
    public OrderDto.Response placeOrder(OrderDto.PlaceRequest req) {
        Order order = Order.builder()
                .nom(req.nom())
                .prenom(req.prenom())
                .telephone(req.telephone())
                .email(req.email())
                .status(Order.OrderStatus.EN_ATTENTE)
                .build();

        for (OrderDto.ItemRequest itemReq : req.items()) {
            Product product = productRepository.findById(itemReq.productId())
                    .filter(p -> !p.isDeleted())
                    .orElseThrow(() -> new BadRequestException("Produit introuvable: " + itemReq.productId()));

            OrderItem item = OrderItem.builder()
                    .order(order)
                    .productId(product.getId())
                    .libelleSnapshot(product.getLibelle())
                    .prixSnapshot(product.getPrix())
                    .quantite(itemReq.quantite())
                    .build();
            order.getItems().add(item);
        }

        addHistoryEntry(order, Order.OrderStatus.EN_ATTENTE, null);
        return toDto(orderRepository.save(order));
    }

    public Page<OrderDto.Response> getOrdersPaged(Order.OrderStatus status, String q, int page, int size, String sortField, String sortDir) {
        Sort.Direction dir = "desc".equalsIgnoreCase(sortDir) ? Sort.Direction.DESC : Sort.Direction.ASC;
        String field = switch (sortField) {
            case "nom", "client" -> "nom";
            case "telephone" -> "telephone";
            case "status" -> "status";
            case "type" -> "type";
            default -> "createdAt";
        };
        Pageable pageable = PageRequest.of(page, size, Sort.by(dir, field));
        Page<Order> raw;
        if (q != null && !q.isBlank()) {
            raw = orderRepository.searchOrdersPaged(q, pageable);
        } else if (status != null) {
            raw = orderRepository.findByStatus(status, pageable);
        } else {
            raw = orderRepository.findAll(pageable);
        }
        return raw.map(this::toDto);
    }

    public Page<OrderDto.Response> getHistoriquePaged(String q, int page, int size, String sortField, String sortDir) {
        Sort.Direction dir = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        String field = switch (sortField) {
            case "nom", "client" -> "nom";
            case "status" -> "status";
            case "createdAt" -> "createdAt";
            default -> "updatedAt";
        };
        Pageable pageable = PageRequest.of(page, size, Sort.by(dir, field));
        if (q != null && !q.isBlank()) {
            return orderRepository.searchHistorique(q, Order.OrderStatus.EN_ATTENTE, pageable).map(this::toDto);
        }
        return orderRepository.findByStatusNot(Order.OrderStatus.EN_ATTENTE, pageable).map(this::toDto);
    }

    public List<OrderDto.Response> getAllOrders() {
        return orderRepository.findAll().stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(this::toDto).toList();
    }

    public List<OrderDto.Response> getOrdersByStatus(Order.OrderStatus status) {
        return orderRepository.findByStatus(status, PageRequest.of(0, 1000, Sort.by(Sort.Direction.DESC, "createdAt")))
                .getContent().stream().map(this::toDto).toList();
    }

    public OrderDto.Response getById(Long id) {
        return toDto(orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Commande introuvable")));
    }

    @Transactional
    public OrderDto.Response updateStatus(Long id, Order.OrderStatus status, String username) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Commande introuvable"));

        User operateur = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));

        order.setStatus(status);
        order.setTreatedBy(operateur);
        addHistoryEntry(order, status, operateur.getFullName());
        return toDto(orderRepository.save(order));
    }

    private void addHistoryEntry(Order order, Order.OrderStatus status, String changedBy) {
        OrderStatusHistory entry = OrderStatusHistory.builder()
                .order(order)
                .status(status)
                .changedAt(LocalDateTime.now())
                .changedBy(changedBy)
                .build();
        order.getStatusHistory().add(entry);
    }

    private OrderDto.Response toDto(Order o) {
        List<OrderDto.ItemResponse> items = o.getItems().stream()
                .map(i -> new OrderDto.ItemResponse(i.getProductId(), i.getLibelleSnapshot(),
                        i.getPrixSnapshot(), i.getQuantite()))
                .toList();
        List<OrderDto.StatusHistoryEntry> history = o.getStatusHistory() != null
                ? o.getStatusHistory().stream()
                    .sorted((a, b) -> a.getChangedAt().compareTo(b.getChangedAt()))
                    .map(h -> new OrderDto.StatusHistoryEntry(h.getStatus().name(), h.getChangedAt(), h.getChangedBy()))
                    .toList()
                : List.of();
        return new OrderDto.Response(
                o.getId(), o.getNom(), o.getPrenom(), o.getAdresse(), o.getTelephone(), o.getEmail(),
                o.getStatus().name(),
                o.getType() != null ? o.getType().name() : Order.OrderType.COMMANDE.name(),
                items,
                o.getTreatedBy() != null ? o.getTreatedBy().getFullName() : null,
                o.getCreatedAt(), o.getUpdatedAt(), history);
    }
}
