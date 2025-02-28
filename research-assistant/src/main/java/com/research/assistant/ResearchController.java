package com.research.assistant;

import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/research")
@CrossOrigin(origins = "*")
@AllArgsConstructor
public class ResearchController {

    private  ResearchService researchService;

    @PostMapping("/process")
    public ResponseEntity<String> processContent(@RequestBody ResearchRequest researchRequest) {
        // Fixed: Use 'researchRequest' instead of 'request'
        String res = researchService.processContent(researchRequest);
        return ResponseEntity.ok(res);
    }
}
