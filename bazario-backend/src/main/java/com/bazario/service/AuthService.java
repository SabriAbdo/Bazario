package com.bazario.service;

import com.bazario.dto.AuthDto;
import com.bazario.entity.User;
import com.bazario.exception.BadRequestException;
import com.bazario.exception.ResourceNotFoundException;
import com.bazario.repository.UserRepository;
import com.bazario.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;

    public AuthDto.AuthResponse login(AuthDto.LoginRequest req) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(req.username(), req.password()));
        } catch (Exception e) {
            throw new BadRequestException("Identifiants incorrects");
        }

        User user = userRepository.findByUsername(req.username())
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());
        String accessToken = jwtTokenProvider.generateAccessToken(userDetails);

        return new AuthDto.AuthResponse(accessToken, toDto(user));
    }

    public AuthDto.UserDto getMe(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
        return toDto(user);
    }

    private AuthDto.UserDto toDto(User user) {
        return new AuthDto.UserDto(
                user.getId(), user.getUsername(), user.getFullName(),
                user.getRole().name(), user.isActive(), user.getAllowedCategories());
    }
}
