package com.storvix.backend;
 import com.storvix.backend.repository.FolderRepository;
  import org.junit.jupiter.api.Test; 
  import org.springframework.beans.factory.annotation.Autowired; 
  import org.springframework.boot.test.context.SpringBootTest; 
  @SpringBootTest public class DbTest
   { 
    @Autowired FolderRepository folderRepository;
     @Test public void test() { 
        System.out.println("TEST_OUTPUT_START"); 
        System.out.println(folderRepository.existsByOwnerIdAndParentFolderIsNullAndNameAndIsDeletedFalse("9f2cc30e-efd4-46da-9bb5-e1a426ebc3e6", "harsh")); 
        System.out.println(folderRepository.findByOwnerIdAndParentFolderIsNullAndIsDeletedFalseOrderByName("9f2cc30e-efd4-46da-9bb5-e1a426ebc3e6").size()); 
        System.out.println("TEST_OUTPUT_END"); 
    } 
}