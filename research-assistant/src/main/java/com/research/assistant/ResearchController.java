package com.research.assistant;

import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;

@RestController
@RequestMapping("/api/research")
@CrossOrigin(origins = "*")
@AllArgsConstructor
public class ResearchController {

    @AutoWired
    private  ResearchService researchService;

    @PostMapping("/process")
    public ResponseEntity<String> processContent(@RequestBody ResearchRequest researchRequest) {
        // Fixed: Use 'researchRequest' instead of 'request'
        String res = researchService.processContent(researchRequest);
        return ResponseEntity.ok(res);
    }
}
