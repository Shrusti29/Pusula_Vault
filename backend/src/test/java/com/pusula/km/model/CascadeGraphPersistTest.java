package com.pusula.km.model;

import com.pusula.km.model.entity.*;
import com.pusula.km.model.enums.DocumentStatus;
import com.pusula.km.model.enums.Role;
import com.pusula.km.repository.DocumentRepository;
import com.pusula.km.repository.DocumentVersionRepository;
import com.pusula.km.repository.FolderRepository;
import com.pusula.km.repository.UserRepository;
import com.pusula.km.repository.WorkspaceRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestConstructor;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("local")
@TestPropertySource(properties = {
    "H2_DIR=./target/pv_test",
    "FILE_UPLOAD_DIR=./target/pv_test",
    "spring.datasource.url=jdbc:h2:file:./target/pv_test/pv_test_db;AUTO_SERVER=TRUE",
    "file.upload-dir=./target/pv_test",
    "spring.jpa.hibernate.ddl-auto=create-drop"
})
@TestConstructor(autowireMode = TestConstructor.AutowireMode.ALL)
class CascadeGraphPersistTest {

    private final UserRepository userRepository;
    private final WorkspaceRepository workspaceRepository;
    private final FolderRepository folderRepository;
    private final DocumentRepository documentRepository;
    private final DocumentVersionRepository documentVersionRepository;

    @Autowired
    CascadeGraphPersistTest(
        UserRepository userRepository,
        WorkspaceRepository workspaceRepository,
        FolderRepository folderRepository,
        DocumentRepository documentRepository,
        DocumentVersionRepository documentVersionRepository
    ) {
        this.userRepository = userRepository;
        this.workspaceRepository = workspaceRepository;
        this.folderRepository = folderRepository;
        this.documentRepository = documentRepository;
        this.documentVersionRepository = documentVersionRepository;
    }

    @Test
    @Transactional
    void persistCascadeGraph_workspaceFolderDocumentVersion_allReferencesResolved() {
        User creator = User.builder()
            .username("tr34_tester")
            .email("tr34.tester@pusula.com")
            .passwordHash("$2a$10$stubbedForTestOnlyXXXXXXXXXXXXXXXXXXXXXXXXXXXX")
            .displayName("TR-3.4 Tester")
            .role(Role.ADMIN)
            .active(true)
            .build();
        creator = userRepository.save(creator);
        assertNotNull(creator.getId());

        Workspace workspace = Workspace.builder()
            .name("TR-3.4 Workspace")
            .description("Cascade persist sandbox")
            .createdBy(creator)
            .build();
        workspace = workspaceRepository.save(workspace);
        assertNotNull(workspace.getId());

        Folder folder = Folder.builder()
            .workspace(workspace)
            .parentFolder(null)
            .name("Root Docs")
            .createdBy(creator)
            .build();
        folder = folderRepository.save(folder);
        assertNotNull(folder.getId());

        Document document = Document.builder()
            .workspace(workspace)
            .folder(folder)
            .title("Architecture Decisions v1")
            .content("# TR-3.4 Test\n\nThis is sample content for the cascade persist test.")
            .contentType("text/markdown")
            .createdBy(creator)
            .updatedBy(creator)
            .currentVersion(1)
            .status(DocumentStatus.ACTIVE)
            .build();
        document = documentRepository.save(document);
        assertNotNull(document.getId());

        DocumentVersion v1 = DocumentVersion.builder()
            .document(document)
            .versionNumber(1)
            .content(document.getContent())
            .createdBy(creator)
            .changeSummary("Initial version")
            .build();
        v1 = documentVersionRepository.save(v1);
        assertNotNull(v1.getId());

        Folder savedFolder = folderRepository.findById(folder.getId()).orElseThrow();
        assertNotNull(savedFolder.getWorkspace(), "Folder.workspace must be present after findById");
        assertEquals(workspace.getId(), savedFolder.getWorkspace().getId());

        Document savedDoc = documentRepository.findById(document.getId()).orElseThrow();
        assertNotNull(savedDoc.getFolder(), "Document.folder must be non-null after findById");
        assertNotNull(savedDoc.getWorkspace(), "Document.workspace must be non-null after findById");
        assertEquals(folder.getId(), savedDoc.getFolder().getId());
        assertEquals(workspace.getId(), savedDoc.getWorkspace().getId());

        DocumentVersion savedVersion = documentVersionRepository.findById(v1.getId()).orElseThrow();
        assertNotNull(savedVersion.getDocument(), "DocumentVersion.document must be present");
        assertEquals(document.getId(), savedVersion.getDocument().getId());
        assertEquals(1, savedVersion.getVersionNumber());
    }
}
