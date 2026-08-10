package com.djibtout.backend.controller;

import io.micrometer.core.instrument.DistributionSummary;
import io.micrometer.core.instrument.MeterRegistry;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/telemetry")
public class TelemetryController {
    private static final Logger log = LoggerFactory.getLogger(TelemetryController.class);
    private final MeterRegistry registry;

    public TelemetryController(MeterRegistry registry) {
        this.registry = registry;
    }

    @PostMapping("/web-vitals")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public void webVital(@Valid @RequestBody WebVitalInput input) {
        DistributionSummary.builder("djibtout.frontend.web_vital")
            .description("Real-user frontend performance metrics")
            .baseUnit("milliseconds")
            .tag("name", input.name())
            .tag("rating", input.rating())
            .publishPercentileHistogram()
            .register(registry)
            .record(input.value());
    }

    @PostMapping("/errors")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public void frontendError(@Valid @RequestBody FrontendErrorInput input) {
        registry.counter("djibtout.frontend.errors", "type", input.type()).increment();
        log.warn("frontend_error type={} path={} source={} line={} column={}",
            input.type(), input.path(), input.source(), input.line(), input.column());
    }

    public record WebVitalInput(
        @NotBlank @Pattern(regexp = "^(TTFB|FCP|LCP|FID|CLS|INP)$") String name,
        double value,
        @NotBlank @Pattern(regexp = "^(good|needs-improvement|poor)$") String rating
    ) {}

    public record FrontendErrorInput(
        @NotBlank @Size(max = 80) String type,
        @NotBlank @Size(max = 300) String path,
        @Size(max = 300) String source,
        Integer line,
        Integer column
    ) {}
}
