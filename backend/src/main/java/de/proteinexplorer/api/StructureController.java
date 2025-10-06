package de.proteinexplorer.api;

import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;

import de.proteinexplorer.service.StructureService; // <— wichtig!

@RestController
@RequestMapping("/api/structures")
@CrossOrigin(origins = "http://localhost:5173") // erlaubt Frontend-Zugriff
public class StructureController {

    private final StructureService structureService;

    public StructureController(StructureService structureService) {
        this.structureService = structureService;
    }


@GetMapping("/{pdbId}/file")
public ResponseEntity<InputStreamResource> getStructureFile(@PathVariable String pdbId)
        throws IOException, InterruptedException {

    Path file = structureService.getOrDownloadMmCif(pdbId);
    InputStreamResource resource = new InputStreamResource(Files.newInputStream(file));

    return ResponseEntity.ok()
            // ganz neutraler Typ, damit der Browser nichts herunterladen will
            .header("Content-Disposition", "inline") // ⬅️ wichtig!
            .header("Cache-Control", "no-cache")
            .contentType(MediaType.TEXT_PLAIN)
            .body(resource);
    }


@GetMapping("/{pdbId}")
public ResponseEntity<?> getStructureInfo(@PathVariable String pdbId) {
    // Wir liefern einfach ein minimales JSON mit der File-URL
    String fileUrl = "http://localhost:8080/api/structures/" + pdbId + "/file";
    return ResponseEntity.ok()
            .body(Map.of(
                    "pdbId", pdbId.toUpperCase(),
                    "fileUrl", fileUrl,
                    "title", "Example structure " + pdbId.toUpperCase(),
                    "chains", List.of("A", "B"),
                    "format", "mmCIF"
            ));
}


    
}
