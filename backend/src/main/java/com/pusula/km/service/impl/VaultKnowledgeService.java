package com.pusula.km.service.impl;

import com.pusula.km.exception.ForbiddenException;
import com.pusula.km.model.entity.AuditLog;
import com.pusula.km.model.entity.Document;
import com.pusula.km.model.entity.DocumentVersion;
import com.pusula.km.model.entity.ProgressReport;
import com.pusula.km.model.entity.User;
import com.pusula.km.model.entity.WorkPresence;
import com.pusula.km.model.entity.Workspace;
import com.pusula.km.repository.AuditLogRepository;
import com.pusula.km.repository.DocumentRepository;
import com.pusula.km.repository.DocumentVersionRepository;
import com.pusula.km.repository.ProgressReportRepository;
import com.pusula.km.repository.UserRepository;
import com.pusula.km.repository.WorkPresenceRepository;
import com.pusula.km.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VaultKnowledgeService {

    private static final Set<String> STOP = Set.of(
            "a", "an", "the", "is", "are", "was", "were", "what", "which", "who", "how", "when", "where",
            "of", "to", "in", "on", "for", "and", "or", "with", "about", "from", "that", "this", "it",
            "do", "does", "did", "can", "please", "me", "my", "our", "we", "you", "tell", "show"
    );

    private final AccessScopeService accessScopeService;
    private final DocumentRepository documentRepository;
    private final DocumentVersionRepository documentVersionRepository;
    private final WorkspaceRepository workspaceRepository;
    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;
    private final WorkPresenceRepository workPresenceRepository;
    private final ProgressReportRepository progressReportRepository;
    private final com.pusula.km.repository.FileAssetRepository fileAssetRepository;
    private final com.pusula.km.storage.StorageService storageService;

    public User requireUser() {
        return accessScopeService.requireUser();
    }

    public User requireLeadership() {
        User user = accessScopeService.requireUser();
        if (!accessScopeService.isLeadership(user)) {
            throw new ForbiddenException("The vault assistant is available to the admin and the founder");
        }
        return user;
    }

    public Map<String, Object> ask(String question) {
        requireUser();
        String q = question == null ? "" : question.trim();
        if (q.isBlank()) {
            return answer("Ask about a document, an uploaded file, a version change, who is working, or a project report.", "empty", List.of());
        }
        String lower = q.toLowerCase(Locale.ROOT);
        if (containsAny(lower, "who is working", "who is active", "currently working", "active now", "who is online")) {
            return answer(presenceNarrative(), "presence", List.of());
        }
        if (containsAny(lower, "compare", "what changed", "what was added", "difference", "previous version", "version")) {
            return compareAnswer(q);
        }
        if (containsAny(lower, "suggest", "improve", "better the research", "recommendation", "what could")) {
            return suggestAnswer(q);
        }
        if (containsAny(lower, "daily", "weekly", "monthly", "report", "summary of work", "progress")) {
            String period = lower.contains("month") ? "MONTHLY" : lower.contains("week") ? "WEEKLY" : "DAILY";
            return answer(buildNarrative(period, Instant.now().minus(windowDays(period), ChronoUnit.DAYS), Instant.now()), "report", List.of());
        }
        return retrieveAnswer(q);
    }

    @Transactional
    public WorkPresence heartbeat(UUID userId, UUID documentId) {
        Document document = documentId == null ? null : documentRepository.findById(documentId).orElse(null);
        WorkPresence presence = workPresenceRepository.findByUserId(userId).orElseGet(() -> WorkPresence.builder().userId(userId).build());
        if (document != null) {
            presence.setDocumentId(document.getId());
            presence.setDocumentTitle(document.getTitle());
            presence.setWorkspaceId(document.getWorkspace() != null ? document.getWorkspace().getId() : null);
        }
        presence.setLastSeenAt(Instant.now());
        return workPresenceRepository.save(presence);
    }

    public List<Map<String, Object>> activePeople() {
        requireUser();
        Instant cutoff = Instant.now().minusSeconds(45);
        List<Map<String, Object>> rows = new ArrayList<>();
        for (WorkPresence presence : workPresenceRepository.findAll()) {
            User user = userRepository.findById(presence.getUserId()).orElse(null);
            boolean active = presence.getLastSeenAt() != null && presence.getLastSeenAt().isAfter(cutoff);
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("userId", presence.getUserId());
            row.put("name", user != null ? user.getDisplayName() : "Unknown");
            row.put("role", user != null ? user.getRole().name() : "");
            row.put("documentId", presence.getDocumentId());
            row.put("documentTitle", presence.getDocumentTitle());
            row.put("active", active);
            row.put("lastSeenAt", presence.getLastSeenAt());
            rows.add(row);
        }
        rows.sort(Comparator.comparing((Map<String, Object> row) -> Boolean.TRUE.equals(row.get("active"))).reversed());
        return rows;
    }

    public List<Map<String, Object>> recentActions(int limit) {
        requireUser();
        List<AuditLog> logs = new ArrayList<>(auditLogRepository.findAll());
        logs.sort(Comparator.comparing(AuditLog::getTimestamp, Comparator.nullsLast(Comparator.reverseOrder())));
        return logs.stream().limit(Math.min(limit, 200)).map(this::actionRow).toList();
    }

    public String buildNarrative(String period, Instant start, Instant end) {
        List<AuditLog> logs = auditLogRepository.findByTimestampBetween(start, end, PageRequest.of(0, 500)).getContent();
        Map<UUID, List<AuditLog>> byActor = logs.stream()
                .filter(log -> log.getActorUserId() != null)
                .collect(Collectors.groupingBy(AuditLog::getActorUserId));
        StringBuilder text = new StringBuilder();
        text.append(period).append(" work report\n");
        text.append("Window: ").append(start).append(" to ").append(end).append("\n\n");
        if (byActor.isEmpty()) {
            text.append("No recorded actions in this window.\n");
        }
        for (Map.Entry<UUID, List<AuditLog>> entry : byActor.entrySet()) {
            User user = userRepository.findById(entry.getKey()).orElse(null);
            String name = user != null ? user.getDisplayName() : entry.getKey().toString();
            Map<String, Long> counts = entry.getValue().stream()
                    .collect(Collectors.groupingBy(log -> log.getAction().name(), Collectors.counting()));
            text.append(name).append(": ");
            text.append(counts.entrySet().stream().map(e -> e.getValue() + " " + e.getKey().toLowerCase(Locale.ROOT).replace('_', ' ')).collect(Collectors.joining(", ")));
            text.append("\n");
            entry.getValue().stream()
                    .filter(log -> log.getAction().name().contains("DOCUMENT") || log.getAction().name().contains("VERSION"))
                    .limit(6)
                    .forEach(log -> text.append("  - ").append(log.getAction().name()).append(" · ").append(nullToEmpty(log.getEntityName())).append("\n"));
        }
        text.append("\nVersion changes\n");
        for (Document document : documentRepository.findAll()) {
            List<DocumentVersion> versions = documentVersionRepository.findByDocumentIdOrderByVersionNumberDesc(document.getId());
            List<DocumentVersion> inWindow = versions.stream()
                    .filter(v -> v.getCreatedAt() != null && !v.getCreatedAt().isBefore(start) && !v.getCreatedAt().isAfter(end))
                    .toList();
            if (inWindow.isEmpty()) continue;
            text.append(document.getTitle()).append(": ").append(inWindow.size()).append(" version(s). ");
            if (versions.size() >= 2) {
                text.append(diffSummary(versions.get(1).getContent(), versions.get(0).getContent()));
            }
            text.append("\n");
        }
        return text.toString().trim();
    }

    @Transactional
    public ProgressReport saveReport(String period, String notes) {
        User author = requireUser();
        String normalized = period == null ? "DAILY" : period.toUpperCase(Locale.ROOT);
        Instant end = Instant.now();
        Instant start = end.minus(windowDays(normalized), ChronoUnit.DAYS);
        ProgressReport report = ProgressReport.builder()
                .period(normalized)
                .periodStart(start)
                .periodEnd(end)
                .generatedSummary(buildNarrative(normalized, start, end))
                .authorNotes(notes == null ? "" : notes.trim())
                .createdBy(author.getId())
                .createdAt(end)
                .build();
        return progressReportRepository.save(report);
    }

    public List<Map<String, Object>> projectStats() {
        requireUser();
        Instant since = LocalDate.now(ZoneOffset.UTC).minusDays(30).atStartOfDay().toInstant(ZoneOffset.UTC);
        List<AuditLog> logs = auditLogRepository.findByTimestampBetween(since, Instant.now(), PageRequest.of(0, 1000)).getContent();
        List<Map<String, Object>> stats = new ArrayList<>();
        for (Workspace workspace : workspaceRepository.findAll()) {
            List<Document> docs = documentRepository.findByWorkspaceId(workspace.getId());
            int versions = 0;
            for (Document doc : docs) {
                versions += documentVersionRepository.findByDocumentIdOrderByVersionNumberDesc(doc.getId()).size();
            }
            Set<UUID> actors = new HashSet<>();
            int edits = 0;
            for (AuditLog log : logs) {
                if (log.getEntityName() == null) continue;
                boolean inWorkspace = docs.stream().anyMatch(d -> log.getEntityName().equals(d.getTitle()) || (d.getId() != null && d.getId().toString().equals(log.getEntityId())));
                if (!inWorkspace) continue;
                edits++;
                if (log.getActorUserId() != null) actors.add(log.getActorUserId());
            }
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("workspaceId", workspace.getId());
            row.put("name", workspace.getName());
            row.put("documents", docs.size());
            row.put("versions", versions);
            row.put("actions", edits);
            row.put("people", actors.size());
            stats.add(row);
        }
        return stats;
    }

    private Map<String, Object> compareAnswer(String question) {
        Document document = bestDocument(question);
        if (document == null) {
            return answer("I could not match that question to a document in the vault.", "compare", List.of());
        }
        List<DocumentVersion> versions = documentVersionRepository.findByDocumentIdOrderByVersionNumberDesc(document.getId());
        if (versions.size() < 2) {
            return answer(document.getTitle() + " has " + versions.size() + " stored version. A comparison needs at least two.", "compare",
                    List.of(source(document, versions.isEmpty() ? null : versions.get(0), plain(document.getContent()))));
        }
        DocumentVersion newer = versions.get(0);
        DocumentVersion older = versions.get(1);
        String summary = document.getTitle() + " — v" + older.getVersionNumber() + " to v" + newer.getVersionNumber() + ".\n"
                + diffSummary(older.getContent(), newer.getContent());
        if (versions.stream().anyMatch(DocumentVersion::isPriority)) {
            summary += "\nPrioritised versions: " + versions.stream().filter(DocumentVersion::isPriority)
                    .map(v -> "v" + v.getVersionNumber() + (v.getPriorityNote() != null ? " (" + v.getPriorityNote() + ")" : ""))
                    .collect(Collectors.joining(", "));
        }
        return answer(summary, "compare", List.of(
                source(document, older, "Previous version"),
                source(document, newer, "Current stored version")
        ));
    }

    private Map<String, Object> suggestAnswer(String question) {
        Document document = bestDocument(question);
        if (document == null) {
            return retrieveAnswer(question);
        }
        String plain = plain(document.getContent());
        List<String> lines = lines(plain);
        List<String> notes = new ArrayList<>();
        if (lines.size() < 4) {
            notes.add("The current text is short (" + lines.size() + " lines). A research note usually needs a question, the evidence, and a conclusion.");
        }
        long headings = lines.stream().filter(line -> line.startsWith("#") || line.endsWith(":")).count();
        if (headings == 0) {
            notes.add("There are no headings. Splitting the note into sections would make later version comparisons clearer.");
        }
        Map<String, Long> repeats = lines.stream().collect(Collectors.groupingBy(line -> line.toLowerCase(Locale.ROOT), Collectors.counting()));
        repeats.entrySet().stream().filter(e -> e.getValue() > 1 && e.getKey().length() > 20).findFirst()
                .ifPresent(e -> notes.add("This line is repeated: \"" + trim(e.getKey(), 140) + "\"."));
        List<DocumentVersion> versions = documentVersionRepository.findByDocumentIdOrderByVersionNumberDesc(document.getId());
        if (versions.size() >= 2) {
            notes.add("Latest change: " + diffSummary(versions.get(1).getContent(), versions.get(0).getContent()));
        } else {
            notes.add("Only one version is stored, so there is no earlier draft to compare yet.");
        }
        if (notes.isEmpty()) {
            notes.add("The document already has structure and more than one version. The next useful edit is to mark the version that should be treated as the source of truth.");
        }
        String body = "Suggestions for " + document.getTitle() + ", based only on the stored text:\n- "
                + String.join("\n- ", notes);
        return answer(body, "suggest", List.of(source(document, versions.isEmpty() ? null : versions.get(0), trim(plain, 280))));
    }

    private Map<String, Object> retrieveAnswer(String question) {
        List<String> terms = terms(question);
        List<Scored> hits = new ArrayList<>();
        for (Document document : documentRepository.findAll()) {
            List<DocumentVersion> versions = documentVersionRepository.findByDocumentIdOrderByVersionNumberDesc(document.getId());
            DocumentVersion latest = versions.isEmpty() ? null : versions.get(0);
            String body = plain(latest != null && latest.getContent() != null ? latest.getContent() : document.getContent());
            String title = document.getTitle() == null ? "" : document.getTitle();
            for (String line : lines(title + "\n" + body)) {
                int score = score(line + " " + title, terms);
                if (score > 0) {
                    hits.add(new Scored(score + (title.toLowerCase(Locale.ROOT).contains(terms.get(0)) ? 2 : 0), document, latest, line));
                }
            }
        }
        for (com.pusula.km.model.entity.FileAsset fileAsset : fileAssetRepository.findAll()) {
            String name = fileAsset.getFileName() != null ? fileAsset.getFileName() : "";
            String ext = fileAsset.getFileType() != null ? fileAsset.getFileType().toLowerCase(Locale.ROOT) : "";
            String content = "";
            if (List.of("txt", "md", "csv", "json").contains(ext)) {
                try (java.io.InputStream is = storageService.load(fileAsset.getStorageKey())) {
                    content = new String(is.readAllBytes(), java.nio.charset.StandardCharsets.UTF_8);
                } catch (Exception ignored) {}
            }
            for (String line : lines(name + "\n" + plain(content))) {
                int score = score(line + " " + name, terms);
                if (score > 0) {
                    Document dummy = fileAsset.getDocument() != null ? fileAsset.getDocument() :
                            Document.builder().id(fileAsset.getId()).title(name).build();
                    hits.add(new Scored(score + (name.toLowerCase(Locale.ROOT).contains(terms.get(0)) ? 2 : 0), dummy, null, line));
                }
            }
        }
        hits.sort(Comparator.comparingInt((Scored hit) -> hit.score).reversed());
        if (hits.isEmpty()) {
            return answer("I could not find that wording in any stored document or uploaded file. Try searching for a specific topic, keyword, or document name.", "retrieve", List.of());
        }
        List<Scored> top = hits.stream().limit(5).toList();
        StringBuilder answer = new StringBuilder("From the vault:\n");
        List<Map<String, Object>> sources = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        for (Scored hit : top) {
            String key = hit.document.getId() + "|" + hit.line;
            if (!seen.add(key)) continue;
            int version = hit.version != null && hit.version.getVersionNumber() != null ? hit.version.getVersionNumber() : 0;
            answer.append("• ").append(hit.document.getTitle()).append(version > 0 ? " v" + version : "").append(": ").append(trim(hit.line, 240)).append("\n");
            sources.add(source(hit.document, hit.version, hit.line));
        }
        return answer(answer.toString().trim(), "retrieve", sources);
    }

    private Document bestDocument(String question) {
        List<String> terms = terms(question);
        Document best = null;
        int bestScore = 0;
        for (Document document : documentRepository.findAll()) {
            int score = score((document.getTitle() == null ? "" : document.getTitle()) + " " + plain(document.getContent()), terms);
            if (document.getTitle() != null && question.toLowerCase(Locale.ROOT).contains(document.getTitle().toLowerCase(Locale.ROOT))) {
                score += 8;
            }
            if (score > bestScore) {
                bestScore = score;
                best = document;
            }
        }
        if (best != null) return best;
        List<Document> all = documentRepository.findAll();
        return all.isEmpty() ? null : all.get(0);
    }

    private String diffSummary(String older, String newer) {
        Set<String> oldLines = new HashSet<>(lines(plain(older)));
        Set<String> newLines = new HashSet<>(lines(plain(newer)));
        List<String> added = newLines.stream().filter(line -> !oldLines.contains(line)).limit(8).toList();
        List<String> removed = oldLines.stream().filter(line -> !newLines.contains(line)).limit(8).toList();
        StringBuilder text = new StringBuilder();
        text.append("Added (").append(added.size()).append(" shown): ");
        text.append(added.isEmpty() ? "nothing new in the stored lines." : added.stream().map(line -> "\"" + trim(line, 120) + "\"").collect(Collectors.joining("; ")));
        text.append(" Removed (").append(removed.size()).append(" shown): ");
        text.append(removed.isEmpty() ? "no earlier lines were dropped." : removed.stream().map(line -> "\"" + trim(line, 120) + "\"").collect(Collectors.joining("; ")));
        return text.toString();
    }

    private String presenceNarrative() {
        Instant cutoff = Instant.now().minusSeconds(45);
        List<String> active = new ArrayList<>();
        List<String> idle = new ArrayList<>();
        for (WorkPresence presence : workPresenceRepository.findAll()) {
            User user = userRepository.findById(presence.getUserId()).orElse(null);
            String name = user != null ? user.getDisplayName() : "Someone";
            String where = presence.getDocumentTitle() == null ? "no document" : presence.getDocumentTitle();
            boolean live = presence.getLastSeenAt() != null && presence.getLastSeenAt().isAfter(cutoff);
            (live ? active : idle).add(name + " — " + where);
        }
        if (active.isEmpty() && idle.isEmpty()) {
            return "Nobody has opened a document in this session yet. Activity appears when an employee, admin, or founder is in a document.";
        }
        return "Active now: " + (active.isEmpty() ? "nobody" : String.join("; ", active))
                + ". Last seen earlier: " + (idle.isEmpty() ? "nobody" : String.join("; ", idle)) + ".";
    }

    private Map<String, Object> actionRow(AuditLog log) {
        User user = log.getActorUserId() == null ? null : userRepository.findById(log.getActorUserId()).orElse(null);
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", log.getId());
        row.put("at", log.getTimestamp());
        row.put("actor", user != null ? user.getDisplayName() : "System");
        row.put("role", log.getActorRole() != null ? log.getActorRole().name() : "");
        row.put("action", log.getAction().name());
        row.put("target", log.getEntityName());
        row.put("success", log.isSuccess());
        return row;
    }

    private Map<String, Object> source(Document document, DocumentVersion version, String excerpt) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("documentId", document.getId());
        row.put("title", document.getTitle());
        row.put("version", version != null ? version.getVersionNumber() : document.getCurrentVersion());
        row.put("excerpt", trim(excerpt, 280));
        return row;
    }

    private Map<String, Object> answer(String text, String intent, List<Map<String, Object>> sources) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("answer", text);
        row.put("intent", intent);
        row.put("sources", sources);
        return row;
    }

    private int score(String haystack, List<String> terms) {
        String lower = haystack.toLowerCase(Locale.ROOT);
        int score = 0;
        for (String term : terms) {
            if (lower.contains(term)) score++;
        }
        return score;
    }

    private List<String> terms(String question) {
        List<String> terms = new ArrayList<>();
        for (String part : question.toLowerCase(Locale.ROOT).split("[^a-z0-9]+")) {
            if (part.length() < 3 || STOP.contains(part)) continue;
            terms.add(part);
        }
        if (terms.isEmpty()) terms.add(question.toLowerCase(Locale.ROOT));
        return terms;
    }

    private List<String> lines(String text) {
        List<String> rows = new ArrayList<>();
        if (text == null) return rows;
        for (String line : text.split("\\n")) {
            String trimmed = line.trim();
            if (!trimmed.isEmpty()) rows.add(trimmed);
        }
        return rows;
    }

    private String plain(String value) {
        if (value == null) return "";
        return value.replaceAll("(?s)<[^>]+>", " ")
                .replace("&nbsp;", " ")
                .replace("&amp;", "&")
                .replaceAll("[\\{\\}\"\\[\\]]", " ")
                .replaceAll("[ \\t]+", " ")
                .replaceAll("\\n{2,}", "\n")
                .trim();
    }

    private String trim(String value, int max) {
        if (value == null) return "";
        String clean = value.replace('\n', ' ').trim();
        return clean.length() <= max ? clean : clean.substring(0, max) + "…";
    }

    private String nullToEmpty(String value) {
        return value == null ? "" : value;
    }

    private boolean containsAny(String text, String... needles) {
        for (String needle : needles) {
            if (text.contains(needle)) return true;
        }
        return false;
    }

    private long windowDays(String period) {
        return switch (period) {
            case "MONTHLY" -> 30;
            case "WEEKLY" -> 7;
            default -> 1;
        };
    }

    private record Scored(int score, Document document, DocumentVersion version, String line) {}
}
