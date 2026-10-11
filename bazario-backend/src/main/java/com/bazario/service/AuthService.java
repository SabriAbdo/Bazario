package com.bazario.service;

import com.bazario.dto.AuthDto;
import com.bazario.entity.User;
import com.bazario.exception.BadRequestException;
import com.bazario.exception.ConflictException;
import com.bazario.exception.ForbiddenException;
import com.bazario.exception.ResourceNotFoundException;
import com.bazario.repository.UserRepository;
import com.bazario.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final PasswordEncoder passwordEncoder;

    public AuthDto.AuthResponse login(AuthDto.LoginRequest req) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(req.username(), req.password()));
        } catch (DisabledException | LockedException e) {
            throw new ForbiddenException("Votre compte n'est pas activé. Veuillez contacter l'administrateur.");
        } catch (Exception e) {
            throw new BadRequestException("Identifiants incorrects");
        }

        User user = userRepository.findByUsernameOrEmail(req.username())
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());
        String accessToken = jwtTokenProvider.generateAccessToken(userDetails);

        return new AuthDto.AuthResponse(accessToken, toDto(user));
    }

    /** Public self-registration — always creates a CLIENT account */
    public AuthDto.AuthResponse register(AuthDto.RegisterRequest req) {
        if (userRepository.existsByUsername(req.username())) {
            throw new ConflictException("Ce nom d'utilisateur est déjà utilisé");
        }
        if (userRepository.existsByEmail(req.email())) {
            throw new ConflictException("Cet email est déjà utilisé");
        }
        User user = userRepository.save(User.builder()
                .username(req.username())
                .email(req.email())
                .password(passwordEncoder.encode(req.password()))
                .fullName(req.fullName())
                .role(User.Role.CLIENT)
                .active(true)
                .build());

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
                user.getId(), user.getUsername(), user.getEmail(), user.getFullName(),
                user.getRole().name(), user.isActive(), user.getAllowedCategories());
    }
}
