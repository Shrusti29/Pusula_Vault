package com.pusula.km.controller.rest;

import com.pusula.km.model.dto.ActivityPeriodBucket;
import com.pusula.km.model.dto.HeatmapCell;
import com.pusula.km.model.dto.OverviewMetrics;
import com.pusula.km.model.dto.ProgressDigest;
import com.pusula.km.model.dto.TopGrantItem;
import com.pusula.km.model.response.ApiResponse;
import com.pusula.km.repository.DocumentRepository;
import com.pusula.km.repository.FileAssetRepository;
import com.pusula.km.repository.UserRepository;
import com.pusula.km.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final UserRepository userRepository;
    private final DocumentRepository documentRepository;
    private final FileAssetRepository fileAssetRepository;
    private final WorkspaceRepository workspaceRepository;

    @GetMapping("/overview")
    public ResponseEntity<ApiResponse<OverviewMetrics>> getOverview() {
        long storage = 0L;
        try {
            storage = fileAssetRepository.findAll().stream()
                    .mapToLong(f -> f.getFileSize() != null ? f.getFileSize() : 0L).sum();
        } catch (Exception ignored) {
        }
        OverviewMetrics m = new OverviewMetrics(
                (int) userRepository.count(),
                (int) documentRepository.count(),
                (int) fileAssetRepository.count(),
                storage,
                0,
                0,
                0,
                0,
                (int) workspaceRepository.count()
        );
        return ResponseEntity.ok(ApiResponse.success(m, "Overview metrics fetched successfully"));
    }

    @GetMapping("/activity")
    public ResponseEntity<ApiResponse<List<ActivityPeriodBucket>>> getActivity() {
        List<ActivityPeriodBucket> buckets = new ArrayList<>();
        DateTimeFormatter fmt = DateTimeFormatter.ISO_LOCAL_DATE;
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        for (int i = 6; i >= 0; i--) {
            String date = today.minusDays(i).format(fmt);
            buckets.add(new ActivityPeriodBucket(date, 0, 0, 0, 0, 0, 0));
        }
        return ResponseEntity.ok(ApiResponse.success(buckets, "Activity fetched successfully"));
    }

    @GetMapping("/heatmap")
    public ResponseEntity<ApiResponse<List<HeatmapCell>>> getHeatmap() {
        List<HeatmapCell> cells = new ArrayList<>();
        DateTimeFormatter fmt = DateTimeFormatter.ISO_LOCAL_DATE;
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        for (int i = 89; i >= 0; i--) {
            String date = today.minusDays(i).format(fmt);
            cells.add(new HeatmapCell(date, 0, 0));
        }
        return ResponseEntity.ok(ApiResponse.success(cells, "Heatmap fetched successfully"));
    }

    @GetMapping("/versions/top-edited")
    public ResponseEntity<ApiResponse<List<Object>>> getTopEdited() {
        return ResponseEntity.ok(ApiResponse.success(Collections.emptyList(), "Top edited fetched successfully"));
    }

    @GetMapping("/contributors/top-active")
    public ResponseEntity<ApiResponse<List<Object>>> getTopActive() {
        return ResponseEntity.ok(ApiResponse.success(Collections.emptyList(), "Top active fetched successfully"));
    }

    @GetMapping("/access/top-grants")
    public ResponseEntity<ApiResponse<List<TopGrantItem>>> getTopGrants() {
        return ResponseEntity.ok(ApiResponse.success(Collections.emptyList(), "Top grants fetched successfully"));
    }

    @GetMapping("/access/top-denied")
    public ResponseEntity<ApiResponse<List<Object>>> getTopDenied() {
        return ResponseEntity.ok(ApiResponse.success(Collections.emptyList(), "Top denied fetched successfully"));
    }

    @GetMapping("/access/suspicious")
    public ResponseEntity<ApiResponse<List<Object>>> getSuspicious() {
        return ResponseEntity.ok(ApiResponse.success(Collections.emptyList(), "Suspicious access fetched successfully"));
    }

    @GetMapping("/progress-{period}")
    public ResponseEntity<ApiResponse<ProgressDigest>> getProgress(@PathVariable String period) {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        DateTimeFormatter fmt = DateTimeFormatter.ISO_LOCAL_DATE;
        String start = today.minusDays(6).format(fmt);
        String end = today.format(fmt);
        ProgressDigest digest = new ProgressDigest(
                Collections.emptyList(),
                null,
                period != null ? period : "week",
                start,
                end
        );
        return ResponseEntity.ok(ApiResponse.success(digest, "Progress digest fetched successfully"));
    }
}
