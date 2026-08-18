package com.djibtout.backend;

import com.djibtout.backend.controller.SellerPortalController;
import com.djibtout.backend.entity.Role;
import com.djibtout.backend.entity.User;
import com.djibtout.backend.repository.*;
import com.djibtout.backend.service.SellerAccessService;
import com.djibtout.backend.service.SellerEventService;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

import java.io.ByteArrayOutputStream;
import java.lang.reflect.Method;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class SellerPortalControllerTests {
    UserRepository users = mock(UserRepository.class);
    ProductRepository products = mock(ProductRepository.class);
    SellerPortalController controller = controller();
    User seller = seller();
    Authentication authentication = new UsernamePasswordAuthenticationToken("seller@test.local", null);

    @Test
    void csvEscapeNeutralizesFormulaTriggers() throws Exception {
        Method escape = SellerPortalController.class.getDeclaredMethod("csvEscape", String.class);
        escape.setAccessible(true);

        assertEquals("\"'=cmd|'/C calc'!A0\"", escape.invoke(controller, "=cmd|'/C calc'!A0"));
        assertEquals("\"'+10\"", escape.invoke(controller, "+10"));
        assertEquals("\"'@user\"", escape.invoke(controller, "@user"));
        assertEquals("\"'\tvalue\"", escape.invoke(controller, "\tvalue"));
    }

    @Test
    void csvImportRejectsInvalidRowButImportsValidRow() {
        when(users.findByEmail("seller@test.local")).thenReturn(Optional.of(seller));
        when(products.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        String invalidName = "x".repeat(201);
        String csv = """
                name,description,price,stockQuantity,category,brand,imageUrl
                %s,Description,100,2,Cat,Brand,https://example.test/a.jpg
                Valide,Description,200,3,Cat,Brand,https://example.test/b.jpg
                """.formatted(invalidName);

        ResponseEntity<?> response = controller.importProducts(authentication,
                new MockMultipartFile("file", "products.csv", "text/csv", csv.getBytes(StandardCharsets.UTF_8)));

        assertEquals(200, response.getStatusCode().value());
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertEquals(1, body.get("imported"), body.toString());
        assertEquals(1, body.get("rejected"), body.toString());
        assertTrue(((java.util.List<?>) body.get("errors")).get(0).toString().startsWith("Ligne 2 :"));
        verify(products, times(1)).save(any());
    }

    @Test
    void xlsxImportRejectsInvalidRowButImportsValidRow() throws Exception {
        when(users.findByEmail("seller@test.local")).thenReturn(Optional.of(seller));
        when(products.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        byte[] xlsx = xlsx("x".repeat(201), "Valide");

        ResponseEntity<?> response = controller.importProductsXlsx(authentication,
                new MockMultipartFile("file", "products.xlsx",
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", xlsx));

        assertEquals(200, response.getStatusCode().value());
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertEquals(1, body.get("imported"), body.toString());
        assertEquals(1, body.get("rejected"), body.toString());
        assertTrue(((java.util.List<?>) body.get("errors")).get(0).toString().startsWith("Ligne 2 :"));
        verify(products, times(1)).save(any());
    }

    private SellerPortalController controller() {
        return new SellerPortalController(users, products, mock(OrderRepository.class),
                mock(SellerStoreRepository.class), mock(SellerFulfillmentRepository.class),
                mock(ProductQuestionRepository.class), mock(ReviewRepository.class),
                mock(ReturnRequestRepository.class), mock(SellerAccessService.class),
                mock(SellerSettlementRepository.class), mock(SellerEventService.class),
                mock(com.djibtout.backend.service.BuyerNotificationService.class),
                validator());
    }

    private Validator validator() {
        return Validation.buildDefaultValidatorFactory().getValidator();
    }

    private User seller() {
        User user = new User();
        user.setId(1L);
        user.setRole(Role.SELLER);
        user.setEmail("seller@test.local");
        return user;
    }

    private byte[] xlsx(String invalidName, String validName) throws Exception {
        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            var sheet = workbook.createSheet();
            String[] headers = {"name", "description", "price", "stockQuantity", "category", "brand", "imageUrl"};
            var header = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) header.createCell(i).setCellValue(headers[i]);
            addRow(sheet.createRow(1), invalidName, "Description", 100, 2, "Cat", "Brand", "https://example.test/a.jpg");
            addRow(sheet.createRow(2), validName, "Description", 200, 3, "Cat", "Brand", "https://example.test/b.jpg");
            ByteArrayOutputStream output = new ByteArrayOutputStream();
            workbook.write(output);
            return output.toByteArray();
        }
    }

    private void addRow(org.apache.poi.ss.usermodel.Row row, String name, String description,
                        double price, int stock, String category, String brand, String image) {
        row.createCell(0).setCellValue(name); row.createCell(1).setCellValue(description);
        row.createCell(2).setCellValue(price); row.createCell(3).setCellValue(stock);
        row.createCell(4).setCellValue(category); row.createCell(5).setCellValue(brand);
        row.createCell(6).setCellValue(image);
    }
}
