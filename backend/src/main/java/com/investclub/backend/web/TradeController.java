package com.investclub.backend.web;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/trades")
@Tag(name = "Trades", description = "Trade placeholders, exits and statistics")
@SecurityRequirement(name = "bearerAuth")
public class TradeController {
    private final TradeService tradeService;

    public TradeController(TradeService tradeService) {
        this.tradeService = tradeService;
    }

    @PostMapping
    @Operation(summary = "Create a trade placeholder")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Trade placeholder created",
            content = @Content(schema = @Schema(implementation = TradePlaceholderDto.class))),
        @ApiResponse(responseCode = "400", description = "Invalid request")
    })
    public ResponseEntity<TradePlaceholderDto> createTrade(
        Authentication authentication,
        @Valid @RequestBody TradePlaceholderRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tradeService.createTrade(authentication.getName(), request));
    }

    @GetMapping
    @Operation(summary = "List current user's trade placeholders")
    public ResponseEntity<List<TradePlaceholderDto>> listTrades(Authentication authentication) {
        return ResponseEntity.ok(tradeService.listTrades(authentication.getName()));
    }

    @GetMapping("/{tradeId}")
    @Operation(summary = "Get trade placeholder details including exits")
    public ResponseEntity<TradePlaceholderDto> getTrade(
        Authentication authentication,
        @PathVariable Long tradeId
    ) {
        return ResponseEntity.ok(tradeService.getTrade(authentication.getName(), tradeId));
    }

    @PostMapping("/{tradeId}/exits")
    @Operation(summary = "Add an exit to a trade placeholder")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Exit added and trade recalculated",
            content = @Content(schema = @Schema(implementation = TradePlaceholderDto.class))),
        @ApiResponse(responseCode = "400", description = "Invalid request or quantity overflow")
    })
    public ResponseEntity<TradePlaceholderDto> addExit(
        Authentication authentication,
        @PathVariable Long tradeId,
        @Valid @RequestBody TradeExitRequest request
    ) {
        return ResponseEntity.ok(tradeService.addExit(authentication.getName(), tradeId, request));
    }

    @GetMapping("/stats")
    @Operation(summary = "Get current user's trade statistics")
    public ResponseEntity<TradeStatsDto> getStats(Authentication authentication) {
        return ResponseEntity.ok(tradeService.getStats(authentication.getName()));
    }
}
