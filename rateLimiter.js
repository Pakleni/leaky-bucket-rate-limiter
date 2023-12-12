
module.exports = {
    _init: function (client) {
        client.defineCommand("refillToken", {
            numberOfKeys: 2,
            lua: `
		local tokens = redis.call("GET", KEYS[1])
		local lastRefill = redis.call("GET", KEYS[2])
		local MAX_TOKENS = tonumber(ARGV[1])
		local REFILL_TIME = tonumber(ARGV[2])

		local t = redis.call('TIME')
		local now = t[1] * 1000 + math.floor(t[2] / 1000)

		if not tokens then
			redis.call("SET", KEYS[1], MAX_TOKENS - 1)
			redis.call("SET", KEYS[2], now)
			return tostring(MAX_TOKENS - 1)
		end

		-- don't add any tokens just in case as we don't know
		-- the last time this was called
		if not lastRefill then
			lastRefill = now
		end

		tokens = tonumber(tokens)
		lastRefill = tonumber(lastRefill)

		local tokensToAdd = math.floor((now - lastRefill) * MAX_TOKENS / REFILL_TIME)
		local newTokens = tokens + tokensToAdd

		-- we don't want to set the new last refill time to now
		-- so that the user doesn't loose time on the rate limit
		local newLastRefill = lastRefill + tokensToAdd * REFILL_TIME / MAX_TOKENS

		if newTokens > MAX_TOKENS then
			newTokens = MAX_TOKENS
		elseif newTokens == 0 then
			return tostring(-1)
		end

		-- we subtract the token after checking whether it's over the limit
		-- to avoid overflowing the bucket
		newTokens = newTokens - 1


		redis.call("SET", KEYS[1], newTokens)
		redis.call("SET", KEYS[2], newLastRefill)

		return tostring(newTokens)
`
        });
    }
}

