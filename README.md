# Binance API Node.js Project

High-performance Node.js application for interacting with the Binance Exchange API (WebSocket and REST).

## Project Overview

This project provides a robust and scalable solution for:
- Connecting to Binance WebSocket streams for real-time market data (trades, depth, klines, etc.).
- Interacting with Binance REST API for trading operations (placing orders, checking account balance, etc.).
- Handling API rate limits and error responses gracefully.
- Structured logging for monitoring and debugging.
- Secure management of API keys.

## Technology Stack

- **Node.js**: Event-driven, non-blocking I/O model.
- **TypeScript**: For static typing and improved code maintainability.
- **`ws`**: High-performance WebSocket client library.
- **`axios`**: Promise-based HTTP client for REST API calls.
- **`pino`**: Fast JSON logger.
- **`dotenv`**: For loading environment variables from a `.env` file.
- **`zod`**: TypeScript-first schema declaration and validation.
- **`pm2`**: Production process manager for Node.js applications.

## Project Structure

```
.env.example         # Example environment variables
.gitignore           # Specifies intentionally untracked files that Git should ignore
package.json         # Project dependencies and scripts
README.md            # This file
PROJECT_TASKS_AND_ROLES.md # Task assignments and role responsibilities
tsconfig.json        # TypeScript compiler options
src/
  config/            # Configuration loading (dotenv, zod validation)
    index.ts
  core/              # Core API interaction logic
    ApiClient.ts     # REST API client (axios)
    WebSocketClient.ts # WebSocket client (ws)
  services/          # Business logic services
    MarketDataService.ts # Service for handling market data subscriptions and processing
    OrderService.ts    # (To be created) Service for order management
    AccountService.ts  # (To be created) Service for account information
  types/             # TypeScript type definitions
    marketData.ts    # Types for WebSocket stream data (trades, depth, etc.)
    api.ts           # (To be created) Types for REST API responses
  utils/             # Utility functions
    logger.ts        # Pino logger setup
    helpers.ts       # (To be created) General helper functions
  server.ts          # Main application entry point
```

## Getting Started

### Prerequisites

- Node.js (v18.x or later recommended)
- npm or yarn

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd binance-api-node
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    # yarn install
    ```

3.  **Set up environment variables:**
    Copy `.env.example` to a new file named `.env`:
    ```bash
    cp .env.example .env
    ```
    Edit the `.env` file and add your Binance API Key and Secret:
    ```env
    BINANCE_API_KEY=your_api_key
    BINANCE_API_SECRET=your_api_secret
    ```
    Adjust other configurations like `PORT` or `LOG_LEVEL` if needed.

### Running the Application

-   **Development Mode (with auto-reloading using `nodemon`):**
    ```bash
    npm run dev
    ```

-   **Production Mode:**
    1.  Build the TypeScript code:
        ```bash
        npm run build
        ```
    2.  Start the application:
        ```bash
        npm start
        ```
    Or using PM2 for process management:
    ```bash
    pm2 start dist/server.js --name binance-api
    ```

### Linting

To check for linting errors:
```bash
npm run lint
```

## Key Features & Implementation Details

-   **WebSocket Connection Management (`WebSocketClient.ts`):**
    -   Automatic reconnection with exponential backoff strategy.
    -   Ping/Pong mechanism to keep the connection alive and detect disconnections.
    -   Handles Binance's 24-hour connection limit by planning reconnections.
    -   Subscription and unsubscription to market data streams.
-   **REST API Interaction (`ApiClient.ts`):**
    -   HMAC SHA256 signature generation for signed endpoints.
    -   Interceptors for request signing and response/error handling.
    -   Manages Binance API rate limits (awareness, logging, basic handling).
-   **Configuration (`config/index.ts`):**
    -   Loads environment variables using `dotenv`.
    -   Validates environment variables using `zod`.
-   **Logging (`utils/logger.ts`):**
    -   Structured JSON logging using `pino`.
    -   Pretty printing in development mode.
-   **Data Handling (`services/MarketDataService.ts`):**
    -   Parses and processes incoming WebSocket messages.
    -   Provides methods to subscribe/unsubscribe from specific market data (e.g., trades, depth for a symbol).
    -   (Future) Integration with strategy modules or data storage.

## Deployment (Conceptual)

1.  **Server Setup:**
    -   Provision a Linux server (e.g., Ubuntu).
    -   Install Node.js, npm/yarn, Git.
    -   Set up a firewall (e.g., UFW).
2.  **Application Deployment:**
    -   Clone the repository to the server.
    -   Install dependencies (`npm install --production`).
    -   Set up environment variables (e.g., using a `.env` file or system environment variables).
    -   Build the application (`npm run build`).
3.  **Process Management:**
    -   Use PM2 to run the application as a background service, manage logs, and enable auto-restart on crashes.
    ```bash
    pm2 start dist/server.js --name binance-api
    pm2 startup # To enable PM2 to start on system boot
    pm2 save    # Save current process list
    ```
4.  **Reverse Proxy (Nginx - Optional but Recommended):**
    -   Install Nginx.
    -   Configure Nginx as a reverse proxy to forward requests to the Node.js application.
    -   Enable HTTPS using Let's Encrypt for secure connections.
    -   Potentially handle load balancing if multiple instances are run.
5.  **Logging and Monitoring:**
    -   Configure PM2 log rotation.
    -   Set up centralized logging (e.g., ELK stack, Grafana Loki) for production logs.
    -   Implement monitoring dashboards (e.g., Grafana with Prometheus) to track application performance, API usage, and system health.

## Security Considerations

-   **API Key Security:**
    -   NEVER hardcode API keys in the source code.
    -   Use environment variables to store API keys.
    -   Restrict API key permissions on Binance to only what is necessary (e.g., enable trading, disable withdrawals if not needed).
    -   Consider IP whitelisting for API keys if your server has a static IP.
-   **Server Security:**
    -   Keep the server operating system and software up-to-date.
    -   Use a firewall (UFW) to block unnecessary ports.
    -   Secure SSH access (e.g., use key-based authentication, disable root login).
    -   Regularly monitor server logs for suspicious activity.
-   **Rate Limiting:**
    -   Be mindful of Binance API rate limits to avoid IP bans.
    -   Implement retry mechanisms with exponential backoff for rate-limited requests.

## TODO / Future Enhancements

-   Implement `OrderService.ts` and `AccountService.ts`.
-   Add comprehensive unit and integration tests.
-   Develop data validation for all API responses and WebSocket messages.
-   Implement more sophisticated rate limit handling (e.g., a queue with delayed execution).
-   Add support for more WebSocket streams (kline, ticker, user data streams).
    -   User Data Stream requires separate listen key management.
-   Database integration for storing market data or trade history.
-   Develop a strategy execution engine.
-   Implement a more robust error handling and notification system (e.g., email/Slack alerts for critical errors).
-   Create detailed API documentation (e.g., using Swagger/OpenAPI for REST, AsyncAPI for WebSocket).

## Contribution

(Details on how to contribute to the project, if applicable)