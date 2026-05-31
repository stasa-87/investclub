package com.investclub.backend.web;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "JWT authentication endpoints")
public class AuthController {
    private final UserService userService;
    private final com.investclub.backend.util.JwtUtil jwtUtil;

    public AuthController(UserService userService, com.investclub.backend.util.JwtUtil jwtUtil) {
        this.userService = userService;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/register")
    @Operation(summary = "Register a new user", security = {})
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "User created",
            content = @Content(schema = @Schema(implementation = UserDto.class))),
        @ApiResponse(responseCode = "400", description = "Validation or uniqueness error")
    })
    public ResponseEntity<UserDto> register(@Valid @RequestBody RegisterRequest req) {
        UserDto user = userService.register(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(user);
    }

    @PostMapping("/login")
    @Operation(summary = "Login with username or email", security = {})
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Authenticated",
            content = @Content(schema = @Schema(implementation = LoginResponse.class))),
        @ApiResponse(responseCode = "401", description = "Invalid credentials")
    })
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest req) {
        LoginResponse resp = userService.login(req, jwtUtil);
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/me")
    @Operation(summary = "Get current user profile")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Current user",
            content = @Content(schema = @Schema(implementation = UserDto.class))),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<?> me(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
        }
        UserDto user = userService.getUserProfile(authentication.getName());
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        }
        return ResponseEntity.ok(user);
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token", security = {})
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Token refreshed",
            content = @Content(schema = @Schema(implementation = RefreshTokenResponse.class))),
        @ApiResponse(responseCode = "401", description = "Invalid refresh token")
    })
    public ResponseEntity<RefreshTokenResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(userService.refresh(request.refreshToken, jwtUtil));
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout by revoking refresh token", security = {})
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Refresh token revoked",
            content = @Content(schema = @Schema(implementation = MessageResponse.class))),
        @ApiResponse(responseCode = "401", description = "Invalid refresh token")
    })
    public ResponseEntity<MessageResponse> logout(@Valid @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(userService.logout(request));
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Create reset password token for local development", security = {})
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Reset token issued for local-dev",
            content = @Content(schema = @Schema(implementation = ForgotPasswordResponse.class)))
    })
    public ResponseEntity<ForgotPasswordResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        return ResponseEntity.ok(userService.forgotPassword(request));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset password using reset token", security = {})
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Password reset completed",
            content = @Content(schema = @Schema(implementation = MessageResponse.class))),
        @ApiResponse(responseCode = "401", description = "Invalid or expired reset token")
    })
    public ResponseEntity<MessageResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        return ResponseEntity.ok(userService.resetPassword(request));
    }

    @PatchMapping(path = "/me/profile-photo", consumes = "multipart/form-data")
    @Operation(summary = "Upload current user profile photo")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Profile photo updated",
            content = @Content(schema = @Schema(implementation = UserDto.class))),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "400", description = "Invalid file")
    })
    public ResponseEntity<UserDto> uploadProfilePhoto(
        Authentication authentication,
        @RequestPart("file") MultipartFile file
    ) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        return ResponseEntity.ok(userService.uploadProfilePhoto(authentication.getName(), file));
    }
}
