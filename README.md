# leaky-bucket-rate-limiter

Example usage:

```js
const Redis = require("ioredis");

// Initialize the Redis client
const client = new Redis("...url...");

// Initialize the rate limiter
require("leaky-bucket-rate-limiter")._init(client)

const MAX_TOKENS = 100;
const REFILL_TIME = 3600000;

// Middleware to check if the user has exceeded the rate limit
const middleware = (req, res, next) => {
    const id = req.params.id;

    // The `refillToken` command will return the number of tokens left in the bucket
    // or -1 if the bucket is empty
    client.refillToken(id, `${id}_last_refill`, MAX_TOKENS, REFILL_TIME)
        .then(tokens => +tokens)
        .then(tokens => {
            if (tokens > -1) {
                next();
            } else {
                return next(new Error("Rate limit exceeded"));
            }
        }).catch(next);
}
```