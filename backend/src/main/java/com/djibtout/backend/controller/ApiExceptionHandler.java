package com.djibtout.backend.controller;

import jakarta.validation.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.time.Instant;
import java.util.*;

/**
 * Traitement centralise des erreurs d'API.
 *
 * Seules deux exceptions etaient traitees : tout le reste sortait en 500, qu'il
 * s'agisse d'une ressource absente, d'une contrainte violee ou d'un fichier trop
 * lourd. L'appelant ne pouvait pas distinguer sa propre erreur d'une panne
 * serveur, et les ecrans affichaient « Erreur 500 » sans rien de exploitable.
 *
 * Volontairement pas de gestionnaire attrape-tout sur Exception : un
 * @RestControllerAdvice simple intercepterait alors les exceptions que Spring MVC
 * traite lui-meme — ressource statique introuvable, methode HTTP non supportee —
 * et transformerait leurs 404 et 405 en 500.
 */
@RestControllerAdvice
public class ApiExceptionHandler {
    private static final org.slf4j.Logger log =
            org.slf4j.LoggerFactory.getLogger(ApiExceptionHandler.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<?> validation(MethodArgumentNotValidException e) {
        Map<String, String> fields = new LinkedHashMap<>();
        e.getBindingResult().getFieldErrors()
                .forEach(x -> fields.putIfAbsent(x.getField(), x.getDefaultMessage()));
        return ResponseEntity.badRequest()
                .body(body(400, "VALIDATION_ERROR", "Données invalides.", fields));
    }

    /** Validation sur un parametre de requete plutot que sur un corps JSON. */
    @ExceptionHandler(ConstraintViolationException.class)
    ResponseEntity<?> contrainte(ConstraintViolationException e) {
        Map<String, String> fields = new LinkedHashMap<>();
        e.getConstraintViolations()
                .forEach(v -> fields.putIfAbsent(String.valueOf(v.getPropertyPath()), v.getMessage()));
        return ResponseEntity.badRequest()
                .body(body(400, "VALIDATION_ERROR", "Données invalides.", fields));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    ResponseEntity<?> badRequest(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(body(400, "BAD_REQUEST", e.getMessage(), null));
    }

    /** Corps JSON absent, tronque ou d'un type incompatible. */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<?> corpsIllisible(HttpMessageNotReadableException e) {
        return ResponseEntity.badRequest()
                .body(body(400, "MALFORMED_BODY", "Corps de requête illisible ou absent.", null));
    }

    /** Identifiant de chemin d'un type inattendu : /api/orders/abc. */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    ResponseEntity<?> parametreInvalide(MethodArgumentTypeMismatchException e) {
        return ResponseEntity.badRequest()
                .body(body(400, "BAD_PARAMETER", "Paramètre « " + e.getName() + " » invalide.", null));
    }

    /**
     * Les depots utilisent abondamment orElseThrow() sans argument : la ressource
     * absente remontait donc en 500 au lieu de 404.
     */
    @ExceptionHandler(NoSuchElementException.class)
    ResponseEntity<?> introuvable(NoSuchElementException e) {
        return ResponseEntity.status(404).body(body(404, "NOT_FOUND", "Ressource introuvable.", null));
    }

    /**
     * Le message d'origine contient la requete SQL et le nom de la contrainte :
     * il est journalise, jamais renvoye.
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<?> integrite(DataIntegrityViolationException e) {
        log.warn("Violation de contrainte en base", e);
        return ResponseEntity.status(409).body(body(409, "CONFLICT",
                "Opération impossible : cette donnée existe déjà ou est référencée ailleurs.", null));
    }

    /** Deux mises a jour concurrentes de la meme ligne : l'appelant peut reessayer. */
    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    ResponseEntity<?> concurrence(ObjectOptimisticLockingFailureException e) {
        return ResponseEntity.status(409).body(body(409, "CONCURRENT_UPDATE",
                "Cette donnée vient d'être modifiée ailleurs. Réessayez.", null));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    ResponseEntity<?> fichierTropLourd(MaxUploadSizeExceededException e) {
        return ResponseEntity.status(413)
                .body(body(413, "PAYLOAD_TOO_LARGE", "Fichier trop volumineux.", null));
    }

    private Map<String, Object> body(int status, String code, String message, Object details) {
        Map<String, Object> value = new LinkedHashMap<>();
        value.put("timestamp", Instant.now());
        value.put("status", status);
        value.put("code", code);
        value.put("message", message == null ? "Erreur de requête." : message);
        if (details != null) value.put("details", details);
        return value;
    }
}
