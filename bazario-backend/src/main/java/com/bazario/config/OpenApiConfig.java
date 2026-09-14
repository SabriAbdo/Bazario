package com.bazario.config;

import io.swagger.v3.oas.models.Operation;
import io.swagger.v3.oas.models.media.Content;
import io.swagger.v3.oas.models.media.MediaType;
import io.swagger.v3.oas.models.media.Schema;
import io.swagger.v3.oas.models.responses.ApiResponse;
import io.swagger.v3.oas.models.responses.ApiResponses;
import org.springdoc.core.customizers.GlobalOpenApiCustomizer;
import org.springdoc.core.customizers.OperationCustomizer;
import org.springdoc.core.customizers.PropertyCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.IdentityHashMap;
import java.util.Map;
import java.util.Set;

/**
 * Documents the error responses actually produced by GlobalExceptionHandler on every
 * endpoint, and marks non-primitive fields nullable — springdoc otherwise generates
 * schemas that don't match real (nullable) response payloads.
 */
@Configuration
public class OpenApiConfig {

    private static final Map<String, String> ERROR_RESPONSES = Map.of(
            "400", "Requête invalide",
            "401", "Non authentifié",
            "403", "Accès refusé",
            "404", "Ressource introuvable",
            "409", "Conflit",
            "500", "Erreur interne du serveur"
    );

    // LocalDateTime is serialized without a zone offset, so it isn't a strict RFC3339
    // 'date-time' — drop that format claim instead of misdocumenting the actual payload.
    @Bean
    public GlobalOpenApiCustomizer dateTimeFormatCustomizer() {
        return openApi -> {
            Set<Schema<?>> visited = java.util.Collections.newSetFromMap(new IdentityHashMap<>());
            if (openApi.getComponents() != null && openApi.getComponents().getSchemas() != null) {
                openApi.getComponents().getSchemas().values().forEach(s -> stripDateTimeFormat(s, visited));
            }
            if (openApi.getPaths() != null) {
                openApi.getPaths().values().forEach(pathItem -> pathItem.readOperations().forEach(op -> {
                    if (op.getRequestBody() != null && op.getRequestBody().getContent() != null) {
                        op.getRequestBody().getContent().values().forEach(mt -> stripDateTimeFormat(mt.getSchema(), visited));
                    }
                    if (op.getResponses() != null) {
                        op.getResponses().values().forEach(resp -> {
                            if (resp.getContent() != null) {
                                resp.getContent().values().forEach(mt -> stripDateTimeFormat(mt.getSchema(), visited));
                            }
                        });
                    }
                }));
            }
        };
    }

    private void stripDateTimeFormat(Schema<?> schema, Set<Schema<?>> visited) {
        if (schema == null || !visited.add(schema)) return;
        if ("date-time".equals(schema.getFormat())) schema.setFormat(null);
        if (schema.getProperties() != null) {
            schema.getProperties().values().forEach(v -> stripDateTimeFormat((Schema<?>) v, visited));
        }
        if (schema.getItems() != null) stripDateTimeFormat(schema.getItems(), visited);
        if (schema.getAnyOf() != null) schema.getAnyOf().forEach(s -> stripDateTimeFormat(s, visited));
        if (schema.getOneOf() != null) schema.getOneOf().forEach(s -> stripDateTimeFormat(s, visited));
        if (schema.getAllOf() != null) schema.getAllOf().forEach(s -> stripDateTimeFormat(s, visited));
        if (schema.getAdditionalProperties() instanceof Schema<?> additional) stripDateTimeFormat(additional, visited);
    }

    @Bean
    public OperationCustomizer errorResponsesCustomizer() {
        return (Operation operation, org.springframework.web.method.HandlerMethod handlerMethod) -> {
            ApiResponses responses = operation.getResponses();
            ERROR_RESPONSES.forEach((code, description) -> {
                if (!responses.containsKey(code)) {
                    responses.addApiResponse(code, new ApiResponse().description(description).content(errorContent()));
                }
            });
            return operation;
        };
    }

    @Bean
    public PropertyCustomizer nullablePropertyCustomizer() {
        return (schema, annotatedType) -> {
            String type = schema.getType();
            if ("string".equals(type) || "number".equals(type) || "integer".equals(type)
                    || "array".equals(type) || "object".equals(type)) {
                schema.setNullable(true);
            }
            return schema;
        };
    }

    private Content errorContent() {
        Schema<?> schema = new Schema<>().type("object")
                .addProperty("status", new Schema<>().type("integer"))
                .addProperty("message", new Schema<>().type("string"));
        return new Content().addMediaType("application/json", new MediaType().schema(schema));
    }
}
