# =========================================
# Stage 1: Build
# =========================================
FROM eclipse-temurin:17-jdk-alpine AS build

WORKDIR /build

# Cache dependencies layer separately
COPY pom.xml .
RUN apk add --no-cache maven && \
    mvn dependency:go-offline -B

COPY src ./src
RUN mvn clean package -DskipTests -B

# =========================================
# Stage 2: Runtime (minimal image)
# =========================================
FROM eclipse-temurin:17-jre-alpine

# Security: run as non-root user
RUN addgroup -S chatengine && adduser -S chatengine -G chatengine

WORKDIR /app

COPY --from=build /build/target/scalable-chat-engine-*.jar app.jar

# Ensure non-root ownership
RUN chown -R chatengine:chatengine /app
USER chatengine

# Health check for Kubernetes liveness probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD wget -qO- http://localhost:8080/actuator/health || exit 1

EXPOSE 8080

ENTRYPOINT ["java", \
    "-Djava.security.egd=file:/dev/./urandom", \
    "-XX:+UseContainerSupport", \
    "-XX:MaxRAMPercentage=75.0", \
    "-jar", "app.jar"]
