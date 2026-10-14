package com.storvix.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank(message = "Please enter a valid full name.")
    @Size(min = 2, max = 100, message = "Full name must be between 2 and 100 characters.")
    private String name;
    
    @NotBlank(message = "Please enter a valid email address.")
    @Email(message = "Please enter a valid email address.")
    private String email;
    
    @NotBlank(message = "Password is required.")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z\\d]).{8,}$",
        message = "Password must contain uppercase, lowercase, number and special character."
    )
    private String password;

    @NotBlank(message = "Confirm password is required.")
    private String confirmPassword;
}
