package com.storvix.backend.service;

import com.storvix.backend.exception.AppException;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class DocumentExtractionService {

    private static final Set<String> SUPPORTED_MIME_TYPES = Set.of(
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/msword",
            "text/plain",
            "text/markdown",
            "text/csv",
            "text/html",
            "application/json"
    );

    private static final Set<String> SUPPORTED_EXTENSIONS = Set.of(
            "pdf", "docx", "doc", "txt", "md", "csv", "json", "js", "jsx", "ts", "tsx", "html", "css", "py", "java", "c", "cpp"
    );

    public boolean isSupportedFileType(String mimeType, String extension, String fileName) {
        String ext = "";
        if (extension != null && !extension.isEmpty()) {
            ext = extension.toLowerCase().replaceAll("^\\.", "");
        } else if (fileName != null && fileName.contains(".")) {
            ext = fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
        }

        if (SUPPORTED_MIME_TYPES.contains(mimeType)) return true;
        if (mimeType != null && mimeType.startsWith("text/")) return true;
        if (SUPPORTED_EXTENSIONS.contains(ext)) return true;
        
        return false;
    }

    public Map<String, Object> extractDocumentText(byte[] buffer, String mimeType, String extension, String fileName) {
        if (!isSupportedFileType(mimeType, extension, fileName)) {
            throw new AppException("AI Assistant is not available for this file type.", HttpStatus.BAD_REQUEST, "UNSUPPORTED_FILE_TYPE");
        }

        String ext = "";
        if (extension != null && !extension.isEmpty()) {
            ext = extension.toLowerCase().replaceAll("^\\.", "");
        } else if (fileName != null && fileName.contains(".")) {
            ext = fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
        }

        if ("application/pdf".equals(mimeType) || "pdf".equals(ext)) {
            return extractPdfText(buffer);
        }

        if ("application/vnd.openxmlformats-officedocument.wordprocessingml.document".equals(mimeType) ||
                "application/msword".equals(mimeType) ||
                "docx".equals(ext) || "doc".equals(ext)) {
            return extractDocxText(buffer);
        }

        return extractPlainText(buffer);
    }

    private Map<String, Object> extractPdfText(byte[] buffer) {
        try (PDDocument document = Loader.loadPDF(buffer)) {
            PDFTextStripper pdfStripper = new PDFTextStripper();
            String text = pdfStripper.getText(document).trim();
            
            if (text.isEmpty()) {
                throw new AppException("The PDF document contains no readable text or is image-only/scanned.", HttpStatus.BAD_REQUEST, "EMPTY_DOCUMENT");
            }

            int numPages = document.getNumberOfPages();
            List<Map<String, Object>> pages = new ArrayList<>();
            
            // For true page-by-page mapping we'd iterate over pages. For simplicity matching node.js fallback:
            for (int i = 1; i <= numPages; i++) {
                pdfStripper.setStartPage(i);
                pdfStripper.setEndPage(i);
                String pageText = pdfStripper.getText(document).trim();
                if (!pageText.isEmpty()) {
                    pages.add(Map.of("pageNumber", i, "text", pageText));
                }
            }

            if (pages.isEmpty()) {
                pages.add(Map.of("pageNumber", 1, "text", text));
            }

            Map<String, Object> result = new HashMap<>();
            result.put("text", text);
            result.put("numPages", numPages);
            result.put("pages", pages);
            return result;
        } catch (IOException e) {
            throw new AppException("Failed to parse PDF document: " + e.getMessage(), HttpStatus.BAD_REQUEST, "PDF_PARSING_FAILED");
        }
    }

    private Map<String, Object> extractDocxText(byte[] buffer) {
        try (ByteArrayInputStream is = new ByteArrayInputStream(buffer);
             XWPFDocument document = new XWPFDocument(is);
             XWPFWordExtractor extractor = new XWPFWordExtractor(document)) {

            String text = extractor.getText().trim();
            if (text.isEmpty()) {
                throw new AppException("The Word document contains no readable text.", HttpStatus.BAD_REQUEST, "EMPTY_DOCUMENT");
            }

            Map<String, Object> result = new HashMap<>();
            result.put("text", text);
            result.put("numPages", 1);
            result.put("pages", List.of(Map.of("pageNumber", 1, "text", text)));
            return result;
        } catch (Exception e) {
            throw new AppException("Failed to parse DOCX document: " + e.getMessage(), HttpStatus.BAD_REQUEST, "DOCX_PARSING_FAILED");
        }
    }

    private Map<String, Object> extractPlainText(byte[] buffer) {
        String text = new String(buffer, StandardCharsets.UTF_8).trim();
        if (text.isEmpty()) {
            throw new AppException("The text document contains no readable text.", HttpStatus.BAD_REQUEST, "EMPTY_DOCUMENT");
        }

        Map<String, Object> result = new HashMap<>();
        result.put("text", text);
        result.put("numPages", 1);
        result.put("pages", List.of(Map.of("pageNumber", 1, "text", text)));
        return result;
    }
}
