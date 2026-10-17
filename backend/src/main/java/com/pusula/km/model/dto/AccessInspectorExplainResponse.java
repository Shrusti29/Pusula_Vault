package com.pusula.km.model.dto;

import java.util.List;

public record AccessInspectorExplainResponse(
        boolean hasAccess,
        List<String> sources
) {}
