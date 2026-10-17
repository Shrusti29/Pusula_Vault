package com.pusula.km.model.dto;

public record DiffRange(
        String type,
        Integer leftStart,
        Integer leftEnd,
        Integer rightStart,
        Integer rightEnd,
        String leftText,
        String rightText
) {}
