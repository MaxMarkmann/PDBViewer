package de.proteinexplorer.service;

import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;

@Service
public class StructureService {

    private static final String BASE_URL = "https://files.rcsb.org/download/";
    private static final Path STRUCTURE_DIR = Path.of("data", "structures");

    public Path getOrDownloadMmCif(String pdbId) throws IOException, InterruptedException {
        Path file = STRUCTURE_DIR.resolve(pdbId.toUpperCase() + ".cif");

        if (Files.exists(file)) {
            return file;
        }

        Files.createDirectories(STRUCTURE_DIR);

        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + pdbId.toUpperCase() + ".cif"))
                .build();

        HttpResponse<Path> response = client.send(request, HttpResponse.BodyHandlers.ofFile(file));

        if (response.statusCode() != 200) {
            throw new IOException("Failed to download structure: " + pdbId);
        }

        return file;
    }
}
