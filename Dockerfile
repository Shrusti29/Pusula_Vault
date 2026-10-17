# Step 1: Build both frontend and backend using Maven
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

# Copy source directories
COPY backend ./backend
COPY frontend ./frontend

# Build the Spring Boot application (includes frontend build via frontend-maven-plugin)
WORKDIR /app/backend
RUN mvn clean package -DskipTests

# Step 2: Runtime image
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

COPY --from=build /app/backend/target/*.jar app.jar

ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["java", "-Dserver.port=${PORT}", "-jar", "app.jar"]
