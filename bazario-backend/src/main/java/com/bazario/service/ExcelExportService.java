package com.bazario.service;

import com.bazario.dto.AdminDto;
import com.bazario.entity.Category;
import com.bazario.entity.Order;
import com.bazario.entity.OrderItem;
import com.bazario.entity.Product;
import com.bazario.entity.User;
import com.bazario.repository.OrderRepository;
import com.bazario.repository.ProductRepository;
import com.bazario.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Builds a single multi-sheet .xlsx workbook summarizing the whole app's data for admins.
 */
@Service
@RequiredArgsConstructor
public class ExcelExportService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final AdminService adminService;

    public byte[] generateFullReport() {
        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            CellStyle headerStyle = buildHeaderStyle(workbook);
            CellStyle titleStyle = buildTitleStyle(workbook);
            CellStyle moneyStyle = buildMoneyStyle(workbook);

            AdminDto.StatsResponse stats = adminService.getStats();
            AdminDto.AdvancedStatsResponse advanced = adminService.getAdvancedStats();

            buildOverviewSheet(workbook, headerStyle, titleStyle, moneyStyle, stats, advanced);
            buildUsersSheet(workbook, headerStyle);
            buildProductsSheet(workbook, headerStyle, moneyStyle);
            buildOrdersSheet(workbook, headerStyle, moneyStyle);
            buildTopProductsSheet(workbook, headerStyle, moneyStyle, advanced);
            buildTopCategoriesSheet(workbook, headerStyle, moneyStyle, advanced);
            buildTopCustomersSheet(workbook, headerStyle, moneyStyle, advanced);
            buildRevenueSeriesSheet(workbook, headerStyle, moneyStyle, advanced);
            buildUserGrowthSheet(workbook, headerStyle, advanced);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new UncheckedIOException("Impossible de generer le rapport Excel", e);
        }
    }

    // ─── Styles ──────────────────────────────────────────────────────────

    private CellStyle buildHeaderStyle(Workbook wb) {
        Font font = wb.createFont();
        font.setBold(true);
        font.setColor(IndexedColors.WHITE.getIndex());
        CellStyle style = wb.createCellStyle();
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.DARK_GREEN.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setBorderBottom(BorderStyle.THIN);
        return style;
    }

    private CellStyle buildTitleStyle(Workbook wb) {
        Font font = wb.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 14);
        CellStyle style = wb.createCellStyle();
        style.setFont(font);
        return style;
    }

    private CellStyle buildMoneyStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        style.setDataFormat(wb.createDataFormat().getFormat("#,##0.00 \"DH\""));
        return style;
    }

    private Row headerRow(Sheet sheet, int rowIdx, CellStyle style, String... headers) {
        Row row = sheet.createRow(rowIdx);
        for (int i = 0; i < headers.length; i++) {
            Cell cell = row.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(style);
        }
        return row;
    }

    private void autoSize(Sheet sheet, int columns) {
        for (int i = 0; i < columns; i++) sheet.autoSizeColumn(i);
    }

    // ─── Sheets ──────────────────────────────────────────────────────────

    private void buildOverviewSheet(XSSFWorkbook wb, CellStyle headerStyle, CellStyle titleStyle, CellStyle moneyStyle,
                                     AdminDto.StatsResponse stats, AdminDto.AdvancedStatsResponse advanced) {
        Sheet sheet = wb.createSheet("Résumé");
        int r = 0;
        Row title = sheet.createRow(r++);
        Cell titleCell = title.createCell(0);
        titleCell.setCellValue("Rapport Bazario — Vue d'ensemble");
        titleCell.setCellStyle(titleStyle);
        r++;

        r = writeKeyValue(sheet, r, "Utilisateurs actifs", stats.totalUsers());
        r = writeKeyValue(sheet, r, "Utilisateurs bannis", stats.bannedUsers());
        r = writeKeyValue(sheet, r, "Vendeurs actifs (opérateurs)", advanced.activeSellers());
        r = writeKeyValue(sheet, r, "Produits en catalogue", stats.totalProducts());
        r = writeKeyValue(sheet, r, "Produits en attente d'approbation", stats.pendingApprovalProducts());
        r = writeKeyValue(sheet, r, "Variantes en stock critique (< 5)", advanced.lowStockVariants());
        r = writeKeyValue(sheet, r, "Commandes totales", stats.totalCommands());
        r = writeKeyValue(sheet, r, "Commandes en attente", stats.commandsEnAttente());
        r = writeKeyValue(sheet, r, "Commandes validées", stats.commandsValidees());
        r = writeKeyValue(sheet, r, "Commandes refusées", stats.commandsRefusees());
        r = writeKeyValue(sheet, r, "Taux de validation (%)", Math.round(advanced.approvalRate() * 100.0) / 100.0);
        r = writeKeyValueMoney(sheet, r, "Revenu (30 derniers jours)", advanced.revenueLast30Days(), moneyStyle);
        r = writeKeyValueMoney(sheet, r, "Revenu total (historique)", advanced.totalRevenueAllTime(), moneyStyle);
        r = writeKeyValueMoney(sheet, r, "Panier moyen", advanced.avgOrderValue(), moneyStyle);
        r = writeKeyValue(sheet, r, "Articles moyens par commande", Math.round(advanced.avgItemsPerOrder() * 100.0) / 100.0);
        r = writeKeyValue(sheet, r, "Commandes (7 derniers jours)", advanced.ordersLast7Days());
        r = writeKeyValue(sheet, r, "Commandes (30 derniers jours)", advanced.ordersLast30Days());
        r++;
        Row genRow = sheet.createRow(r);
        genRow.createCell(0).setCellValue("Généré le");
        genRow.createCell(1).setCellValue(java.time.LocalDateTime.now().format(DATE_FMT));

        sheet.setColumnWidth(0, 38 * 256);
        sheet.setColumnWidth(1, 20 * 256);
    }

    private int writeKeyValue(Sheet sheet, int r, String label, Number value) {
        Row row = sheet.createRow(r);
        row.createCell(0).setCellValue(label);
        row.createCell(1).setCellValue(value.doubleValue());
        return r + 1;
    }

    private int writeKeyValueMoney(Sheet sheet, int r, String label, BigDecimal value, CellStyle moneyStyle) {
        Row row = sheet.createRow(r);
        row.createCell(0).setCellValue(label);
        Cell cell = row.createCell(1);
        cell.setCellValue(value == null ? 0 : value.doubleValue());
        cell.setCellStyle(moneyStyle);
        return r + 1;
    }

    private void buildUsersSheet(XSSFWorkbook wb, CellStyle headerStyle) {
        Sheet sheet = wb.createSheet("Utilisateurs");
        headerRow(sheet, 0, headerStyle, "ID", "Nom complet", "Nom d'utilisateur", "Email", "Rôle", "Actif", "Banni", "Créé le");
        List<User> users = userRepository.findAllByDeletedFalse();
        int r = 1;
        for (User u : users) {
            Row row = sheet.createRow(r++);
            row.createCell(0).setCellValue(u.getId());
            row.createCell(1).setCellValue(u.getFullName());
            row.createCell(2).setCellValue(u.getUsername());
            row.createCell(3).setCellValue(u.getEmail() == null ? "" : u.getEmail());
            row.createCell(4).setCellValue(u.getRole().name());
            row.createCell(5).setCellValue(u.isActive() ? "Oui" : "Non");
            row.createCell(6).setCellValue(u.isActive() ? "Non" : "Oui");
            row.createCell(7).setCellValue(u.getCreatedAt() == null ? "" : u.getCreatedAt().format(DATE_FMT));
        }
        autoSize(sheet, 8);
    }

    private void buildProductsSheet(XSSFWorkbook wb, CellStyle headerStyle, CellStyle moneyStyle) {
        Sheet sheet = wb.createSheet("Produits");
        headerRow(sheet, 0, headerStyle, "ID", "Libellé", "Prix", "Catégories", "Marque", "Stock total",
                "Approuvé", "Likes", "Créé par", "Créé le");
        List<Product> products = productRepository.findAllActive();
        int r = 1;
        for (Product p : products) {
            Row row = sheet.createRow(r++);
            row.createCell(0).setCellValue(p.getId());
            row.createCell(1).setCellValue(p.getLibelle());
            Cell priceCell = row.createCell(2);
            priceCell.setCellValue(p.getPrix() == null ? 0 : p.getPrix().doubleValue());
            priceCell.setCellStyle(moneyStyle);
            row.createCell(3).setCellValue(p.getCategories().stream().map(Category::getLabel).collect(Collectors.joining(", ")));
            row.createCell(4).setCellValue(p.getMarque() == null ? "" : p.getMarque());
            int totalStock = p.getVariants().stream().mapToInt(v -> v.getStock()).sum();
            row.createCell(5).setCellValue(totalStock);
            row.createCell(6).setCellValue(p.isApprovedByAdmin() ? "Oui" : "Non");
            row.createCell(7).setCellValue(p.getLikesCount());
            row.createCell(8).setCellValue(p.getCreatedBy() == null ? "" : p.getCreatedBy().getFullName());
            row.createCell(9).setCellValue(p.getCreatedAt() == null ? "" : p.getCreatedAt().format(DATE_FMT));
        }
        autoSize(sheet, 10);
    }

    private void buildOrdersSheet(XSSFWorkbook wb, CellStyle headerStyle, CellStyle moneyStyle) {
        Sheet sheet = wb.createSheet("Commandes");
        headerRow(sheet, 0, headerStyle, "ID", "Client", "Téléphone", "Statut", "Type", "Articles", "Total",
                "Traité par", "Créé le");
        List<Order> orders = orderRepository.findAll();
        int r = 1;
        for (Order o : orders) {
            Row row = sheet.createRow(r++);
            row.createCell(0).setCellValue(o.getId());
            row.createCell(1).setCellValue((o.getPrenom() + " " + o.getNom()).trim());
            row.createCell(2).setCellValue(o.getTelephone() == null ? "" : o.getTelephone());
            row.createCell(3).setCellValue(o.getStatus().name());
            row.createCell(4).setCellValue(o.getType().name());
            int itemCount = o.getItems().stream().mapToInt(OrderItem::getQuantite).sum();
            row.createCell(5).setCellValue(itemCount);
            BigDecimal total = o.getItems().stream()
                    .map(it -> it.getPrixSnapshot().multiply(BigDecimal.valueOf(it.getQuantite())))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            Cell totalCell = row.createCell(6);
            totalCell.setCellValue(total.doubleValue());
            totalCell.setCellStyle(moneyStyle);
            row.createCell(7).setCellValue(o.getTreatedBy() == null ? "" : o.getTreatedBy().getFullName());
            row.createCell(8).setCellValue(o.getCreatedAt() == null ? "" : o.getCreatedAt().format(DATE_FMT));
        }
        autoSize(sheet, 9);
    }

    private void buildTopProductsSheet(XSSFWorkbook wb, CellStyle headerStyle, CellStyle moneyStyle, AdminDto.AdvancedStatsResponse advanced) {
        Sheet sheet = wb.createSheet("Meilleures ventes");
        headerRow(sheet, 0, headerStyle, "Produit ID", "Libellé", "Quantité vendue", "Revenu généré");
        int r = 1;
        for (AdminDto.TopProduct p : advanced.topProducts()) {
            Row row = sheet.createRow(r++);
            row.createCell(0).setCellValue(p.productId());
            row.createCell(1).setCellValue(p.label());
            row.createCell(2).setCellValue(p.quantitySold());
            Cell cell = row.createCell(3);
            cell.setCellValue(p.revenue() == null ? 0 : p.revenue().doubleValue());
            cell.setCellStyle(moneyStyle);
        }
        autoSize(sheet, 4);
    }

    private void buildTopCategoriesSheet(XSSFWorkbook wb, CellStyle headerStyle, CellStyle moneyStyle, AdminDto.AdvancedStatsResponse advanced) {
        Sheet sheet = wb.createSheet("Ventes par catégorie");
        headerRow(sheet, 0, headerStyle, "Catégorie", "Quantité vendue", "Revenu généré");
        int r = 1;
        for (AdminDto.TopCategory c : advanced.topCategories()) {
            Row row = sheet.createRow(r++);
            row.createCell(0).setCellValue(c.label());
            row.createCell(1).setCellValue(c.quantitySold());
            Cell cell = row.createCell(2);
            cell.setCellValue(c.revenue() == null ? 0 : c.revenue().doubleValue());
            cell.setCellStyle(moneyStyle);
        }
        autoSize(sheet, 3);
    }

    private void buildTopCustomersSheet(XSSFWorkbook wb, CellStyle headerStyle, CellStyle moneyStyle, AdminDto.AdvancedStatsResponse advanced) {
        Sheet sheet = wb.createSheet("Meilleurs clients");
        headerRow(sheet, 0, headerStyle, "Client ID", "Nom", "Nombre de commandes", "Total dépensé");
        int r = 1;
        for (AdminDto.TopCustomer c : advanced.topCustomers()) {
            Row row = sheet.createRow(r++);
            row.createCell(0).setCellValue(c.customerId());
            row.createCell(1).setCellValue(c.name() == null ? "" : c.name());
            row.createCell(2).setCellValue(c.orderCount());
            Cell cell = row.createCell(3);
            cell.setCellValue(c.totalSpent() == null ? 0 : c.totalSpent().doubleValue());
            cell.setCellStyle(moneyStyle);
        }
        autoSize(sheet, 4);
    }

    private void buildRevenueSeriesSheet(XSSFWorkbook wb, CellStyle headerStyle, CellStyle moneyStyle, AdminDto.AdvancedStatsResponse advanced) {
        Sheet sheet = wb.createSheet("Revenu quotidien");
        headerRow(sheet, 0, headerStyle, "Date", "Commandes", "Revenu");
        int r = 1;
        for (AdminDto.TimeSeriesPoint p : advanced.revenueSeries()) {
            Row row = sheet.createRow(r++);
            row.createCell(0).setCellValue(p.date());
            row.createCell(1).setCellValue(p.orders());
            Cell cell = row.createCell(2);
            cell.setCellValue(p.revenue() == null ? 0 : p.revenue().doubleValue());
            cell.setCellStyle(moneyStyle);
        }
        autoSize(sheet, 3);
    }

    private void buildUserGrowthSheet(XSSFWorkbook wb, CellStyle headerStyle, AdminDto.AdvancedStatsResponse advanced) {
        Sheet sheet = wb.createSheet("Croissance utilisateurs");
        headerRow(sheet, 0, headerStyle, "Mois", "Nouveaux utilisateurs");
        int r = 1;
        for (AdminDto.MonthlyPoint p : advanced.userGrowth()) {
            Row row = sheet.createRow(r++);
            row.createCell(0).setCellValue(p.month());
            row.createCell(1).setCellValue(p.count());
        }
        autoSize(sheet, 2);
    }
}
