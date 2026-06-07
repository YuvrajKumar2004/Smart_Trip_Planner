package com.yuvraj.service;

import com.yuvraj.dto.package_dto.PackageDTOs.PackageRequest;
import com.yuvraj.dto.package_dto.PackageDTOs.PackageResponse;
import com.yuvraj.entity.Package;
import com.yuvraj.exception.ResourceNotFoundException;
import com.yuvraj.repository.PackageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PackageService {

    private final PackageRepository packageRepository;

    @Transactional
    public PackageResponse addPackage(PackageRequest request) {
        log.info("Creating a new package: {}", request.getTitle());

        Package packageEntity = Package.builder()
                .title(request.getTitle())
                .destination(request.getDestination())
                .price(request.getPrice())
                .duration(request.getDuration())
                .description(request.getDescription())
                .imageUrl(request.getImageUrl())
                .availableSeats(request.getAvailableSeats())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .build();

        Package saved = packageRepository.save(packageEntity);
        log.info("Successfully created package with ID: {}", saved.getId());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<PackageResponse> getAllPackages() {
        return packageRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deletePackage(Long id) {
        log.info("Deleting package with ID: {}", id);
        Package pkg = packageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Package not found: " + id));
        packageRepository.delete(pkg);
        log.info("Successfully deleted package with ID: {}", id);
    }

    private PackageResponse toResponse(Package p) {
        return PackageResponse.builder()
                .id(p.getId())
                .title(p.getTitle())
                .destination(p.getDestination())
                .price(p.getPrice())
                .duration(p.getDuration())
                .description(p.getDescription())
                .imageUrl(p.getImageUrl())
                .availableSeats(p.getAvailableSeats())
                .startDate(p.getStartDate())
                .endDate(p.getEndDate())
                .createdAt(p.getCreatedAt() != null ? p.getCreatedAt().toString() : null)
                .updatedAt(p.getUpdatedAt() != null ? p.getUpdatedAt().toString() : null)
                .build();
    }
}
