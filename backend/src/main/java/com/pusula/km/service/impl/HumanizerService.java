package com.pusula.km.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class HumanizerService {

    private final ObjectMapper mapper = new ObjectMapper();

    public String humanize(String content, String documentType, String tone) {
        String type = documentType == null ? "TEXT" : documentType.toUpperCase(Locale.ROOT);
        String safeTone = tone == null || tone.isBlank() ? "Professional" : tone;
        if (content == null || content.isBlank()) {
            return content == null ? "" : content;
        }
        try {
            return switch (type) {
                case "EXCEL" -> humanizeSheet(content, safeTone);
                case "POWERPOINT" -> humanizeSlides(content, safeTone);
                case "CODEBASE" -> humanizeCode(content, safeTone);
                default -> humanizeProse(content, safeTone);
            };
        } catch (Exception ex) {
            return humanizeProse(content, safeTone);
        }
    }

    private String humanizeSheet(String content, String tone) throws Exception {
        JsonNode root = mapper.readTree(content);
        if (!root.has("rows") || !root.get("rows").isArray()) {
            return humanizeProse(content, tone);
        }
        ArrayNode rows = (ArrayNode) root.get("rows");
        for (JsonNode row : rows) {
            if (!row.isArray()) continue;
            for (int i = 0; i < row.size(); i++) {
                String value = row.get(i).asText("");
                if (value.isBlank() || value.matches("-?\\d+([.,]\\d+)?")) continue;
                ((ArrayNode) row).set(i, mapper.getNodeFactory().textNode(rewrite(value, tone)));
            }
        }
        return mapper.writeValueAsString(root);
    }

    private String humanizeSlides(String content, String tone) throws Exception {
        JsonNode root = mapper.readTree(content);
        if (!root.has("slides") || !root.get("slides").isArray()) {
            return humanizeProse(content, tone);
        }
        for (JsonNode slide : root.get("slides")) {
            if (!(slide instanceof ObjectNode obj)) continue;
            if (obj.has("title")) {
                obj.put("title", rewrite(obj.get("title").asText(""), tone));
            }
            if (obj.has("bullets") && obj.get("bullets").isArray()) {
                ArrayNode bullets = (ArrayNode) obj.get("bullets");
                for (int i = 0; i < bullets.size(); i++) {
                    bullets.set(i, mapper.getNodeFactory().textNode(rewrite(bullets.get(i).asText(""), tone)));
                }
            }
        }
        return mapper.writeValueAsString(root);
    }

    private String humanizeCode(String content, String tone) throws Exception {
        JsonNode root = mapper.readTree(content);
        if (!root.has("code")) {
            return humanizeProse(content, tone);
        }
        ObjectNode obj = (ObjectNode) root;
        String code = obj.get("code").asText("");
        StringBuilder out = new StringBuilder();
        for (String line : code.split("\\n", -1)) {
            String trimmed = line.stripLeading();
            if (trimmed.startsWith("//") || trimmed.startsWith("#") || trimmed.startsWith("--")) {
                int marker = line.indexOf(trimmed.substring(0, 2));
                String prefix = line.substring(0, marker + (trimmed.startsWith("--") ? 2 : 2));
                String comment = line.substring(prefix.length()).trim();
                out.append(prefix).append(' ').append(rewrite(comment, tone));
            } else {
                out.append(line);
            }
            out.append('\n');
        }
        if (out.length() > 0) out.setLength(out.length() - 1);
        obj.put("code", out.toString());
        return mapper.writeValueAsString(obj);
    }

    private String humanizeProse(String content, String tone) {
        boolean html = content.contains("<");
        String plain = html
                ? content.replaceAll("(?s)<[^>]+>", " ").replace("&nbsp;", " ").replace("&amp;", "&")
                : content;
        String rewritten = rewrite(plain, tone);
        if (!html) {
            return rewritten;
        }
        String[] parts = rewritten.split("(?<=\\.)\\s+");
        StringBuilder htmlOut = new StringBuilder();
        for (String part : parts) {
            if (part.isBlank()) continue;
            htmlOut.append("<p>").append(escape(part.trim())).append("</p>");
        }
        return htmlOut.length() == 0 ? "<p></p>" : htmlOut.toString();
    }

    String rewrite(String text, String tone) {
        if (text == null) return "";
        String cleaned = text.replaceAll("\\s+", " ").trim();
        if (cleaned.isEmpty()) return "";
        cleaned = cleaned
                .replaceAll("(?i)\\bgonna\\b", "going to")
                .replaceAll("(?i)\\bwanna\\b", "want to")
                .replaceAll("(?i)\\bkinda\\b", "somewhat")
                .replaceAll("(?i)\\ba lot of\\b", "many")
                .replaceAll("(?i)\\bvery unique\\b", "distinct")
                .replaceAll("(?i)\\bin order to\\b", "to")
                .replaceAll("(?i)\\bdue to the fact that\\b", "because")
                .replaceAll("(?i)\\bat this point in time\\b", "now")
                .replaceAll("(?i)\\bas soon as possible\\b", "promptly");

        if ("Concise".equalsIgnoreCase(tone)) {
            cleaned = cleaned
                    .replaceAll("(?i)\\b(really|basically|actually|just|very|extremely)\\b", "")
                    .replaceAll("\\s{2,}", " ")
                    .trim();
        } else if ("Conversational".equalsIgnoreCase(tone)) {
            cleaned = cleaned
                    .replaceAll("(?i)\\bdo not\\b", "don't")
                    .replaceAll("(?i)\\bcannot\\b", "can't")
                    .replaceAll("(?i)\\bit is\\b", "it's");
        } else if ("Technical".equalsIgnoreCase(tone)) {
            cleaned = cleaned
                    .replaceAll("(?i)\\buse\\b", "use")
                    .replaceAll("(?i)\\bmake sure\\b", "verify")
                    .replaceAll("(?i)\\bset up\\b", "configure");
        } else {
            cleaned = cleaned
                    .replaceAll("(?i)\\bdon't\\b", "do not")
                    .replaceAll("(?i)\\bcan't\\b", "cannot")
                    .replaceAll("(?i)\\bwon't\\b", "will not")
                    .replaceAll("(?i)\\bit's\\b", "it is");
        }

        List<String> sentences = splitSentences(cleaned);
        List<String> polished = new ArrayList<>();
        for (String sentence : sentences) {
            String s = sentence.trim();
            if (s.isEmpty()) continue;
            s = Character.toUpperCase(s.charAt(0)) + s.substring(1);
            if (!s.endsWith(".") && !s.endsWith("!") && !s.endsWith("?")) {
                s = s + ".";
            }
            polished.add(s);
        }
        return String.join(" ", polished);
    }

    private List<String> splitSentences(String text) {
        List<String> sentences = new ArrayList<>();
        Matcher matcher = Pattern.compile("[^.!?]+[.!?]?").matcher(text);
        while (matcher.find()) {
            sentences.add(matcher.group().trim());
        }
        if (sentences.isEmpty()) {
            sentences.add(text);
        }
        return sentences;
    }

    private String escape(String value) {
        return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
