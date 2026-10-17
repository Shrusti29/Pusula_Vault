package com.pusula.km.model.dto;

import java.util.List;

public record ExportRequest(
        String type,
        List<String> resourceIds,
        boolean includeHistory
) {}
