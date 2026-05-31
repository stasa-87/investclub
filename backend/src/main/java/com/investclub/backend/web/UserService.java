package com.investclub.backend.web;

import com.investclub.backend.util.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;
    private final StorageService storageService;

    public UserService(
        UserRepository userRepository,
        PasswordEncoder passwordEncoder,
        TokenService tokenService,
        StorageService storageService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenService = tokenService;
        this.storageService = storageService;
    }

    public UserDto register(RegisterRequest req) {
        if (userRepository.existsByUsername(req.username)) {
            throw new IllegalArgumentException("Username already exists");
        }
        if (userRepository.existsByEmail(req.email)) {
            throw new IllegalArgumentException("Email already exists");
        }
        String hash = passwordEncoder.encode(req.password);
        var user = userRepository.save(req.username, req.email, hash, req.profilePhotoUrl);
        return new UserDto(user.id(), user.username(), user.email(), user.profilePhotoUrl());
    }

    public LoginResponse login(LoginRequest req, JwtUtil jwtUtil) {
        var user = userRepository.findByUsernameOrEmail(req.usernameOrEmail);
        if (user == null || !passwordEncoder.matches(req.password, user.passwordHash())) {
            throw new IllegalStateException("Invalid credentials");
        }
        UserDto dto = new UserDto(user.id(), user.username(), user.email(), user.profilePhotoUrl());
        String token = jwtUtil.generateToken(user.id(), user.username(), user.email());
        String refreshToken = tokenService.createRefreshToken(user.id()).token();
        return new LoginResponse(token, refreshToken, dto);
    }

    public UserDto getUserProfile(String username) {
        var user = userRepository.findByUsernameOrEmail(username);
        if (user == null) return null;
        return new UserDto(user.id(), user.username(), user.email(), user.profilePhotoUrl());
    }

    public RefreshTokenResponse refresh(String refreshToken, JwtUtil jwtUtil) {
        var rotated = tokenService.rotateRefreshToken(refreshToken);
        var user = userRepository.findById(rotated.userId());
        if (user == null) {
            throw new IllegalStateException("User not found");
        }

        UserDto dto = new UserDto(user.id(), user.username(), user.email(), user.profilePhotoUrl());
        String accessToken = jwtUtil.generateToken(user.id(), user.username(), user.email());
        return new RefreshTokenResponse(accessToken, rotated.token(), dto);
    }

    public ForgotPasswordResponse forgotPassword(ForgotPasswordRequest request) {
        var user = userRepository.findByEmail(request.email);
        if (user == null) {
            return new ForgotPasswordResponse("If the account exists, a reset token has been issued.", null);
        }

        var token = tokenService.createPasswordResetToken(user.id());
        return new ForgotPasswordResponse("Reset token generated for local development.", token.token());
    }

    public MessageResponse resetPassword(ResetPasswordRequest request) {
        var tokenRecord = tokenService.validatePasswordResetToken(request.token);
        String passwordHash = passwordEncoder.encode(request.newPassword);
        userRepository.updatePassword(tokenRecord.userId(), passwordHash);
        tokenService.revokeAllRefreshTokens(tokenRecord.userId());
        tokenService.markPasswordResetTokenUsed(request.token);
        return new MessageResponse("Password updated successfully");
    }

    public UserDto uploadProfilePhoto(String username, MultipartFile file) {
        var user = userRepository.findByUsernameOrEmail(username);
        if (user == null) {
            throw new IllegalStateException("User not found");
        }

        String oldProfilePhotoUrl = user.profilePhotoUrl();
        String profilePhotoUrl = storageService.storeProfilePhoto(file);
        try {
            userRepository.updateProfilePhotoUrl(user.id(), profilePhotoUrl);
        } catch (RuntimeException exception) {
            storageService.deleteProfilePhoto(profilePhotoUrl);
            throw exception;
        }

        storageService.deleteProfilePhoto(oldProfilePhotoUrl);
        return new UserDto(user.id(), user.username(), user.email(), profilePhotoUrl);
    }

    public MessageResponse logout(RefreshTokenRequest request) {
        tokenService.revokeRefreshToken(request.refreshToken);
        return new MessageResponse("Logged out successfully");
    }
}
