package com.yuvraj.controller;

import com.yuvraj.dto.ApiResponse;
import com.yuvraj.dto.package_dto.PackageDTOs.PackageRequest;
import com.yuvraj.dto.package_dto.PackageDTOs.PackageResponse;
import com.yuvraj.service.PackageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/packages")
@RequiredArgsConstructor
public class PackageController {

    private final PackageService packageService;

    /**
     * POST /api/packages/add
     * Adds a new travel package.
     * Restricted to ADMIN and SUPER_ADMIN.
     */
    @PostMapping("/add")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<PackageResponse>> addPackage(
            @Valid @RequestBody PackageRequest request) {
        PackageResponse response = packageService.addPackage(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Package added successfully", response));
    }

    /**
     * GET /api/packages
     * Fetch all travel packages.
     * Accessible by authenticated users.
     */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<PackageResponse>>> getAllPackages() {
        List<PackageResponse> response = packageService.getAllPackages();
        return ResponseEntity.ok(ApiResponse.success("Packages retrieved successfully", response));
    }

    /**
     * DELETE /api/packages/{id}
     * Deletes a package by ID.
     * Restricted to ADMIN and SUPER_ADMIN.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deletePackage(@PathVariable Long id) {
        packageService.deletePackage(id);
        return ResponseEntity.ok(ApiResponse.success("Package deleted successfully", null));
    }
}
