package com.pusula.km.model.dto;

import java.util.List;
import java.util.UUID;

public record DocumentDiffResponse(
        UUID documentId,
        int leftVersion,
        int rightVersion,
        List<DiffRange> added,
        List<DiffRange> deleted,
        List<DiffRange> modified,
        String unifiedText
) {}
