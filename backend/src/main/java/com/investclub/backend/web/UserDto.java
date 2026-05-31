package com.investclub.backend.web;

public class UserDto {
    public Long id;
    public String username;
    public String email;
    public String profilePhotoUrl;

    public UserDto() {}
    public UserDto(Long id, String username, String email, String profilePhotoUrl) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.profilePhotoUrl = profilePhotoUrl;
    }
}
