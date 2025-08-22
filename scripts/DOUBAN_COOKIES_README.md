# Douban Crawler Cookie Configuration

The `douban-crawl.ts` script supports using cookies to access Douban movie pages. This can help avoid rate limiting and access restrictions.

## Environment Variables

Create a `.env` file in the `next-app` directory with the following variables:

### Required Variables

- None (cookies are optional)

### Optional Variables

#### Custom User Agent

```
DOUBAN_USER_AGENT=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36
```

#### Cookie Configuration (Choose ONE method)

**Method 1: JSON Cookie Array (Recommended)**

```
DOUBAN_COOKIES_JSON=[{"name":"cookie1","value":"value1","domain":".douban.com","path":"/"},{"name":"cookie2","value":"value2","domain":".douban.com","path":"/"}]
```

**Method 2: Raw Cookie Header String**

```
DOUBAN_COOKIE_HEADER=cookie1=value1; cookie2=value2; cookie3=value3
```

## How to Get Cookies

### From Chrome DevTools:

1. Open Chrome and go to `https://movie.douban.com`
2. Open DevTools (F12)
3. Go to Application/Storage tab
4. Click on Cookies in the left sidebar
5. Select `https://movie.douban.com`
6. Copy the cookies you need

### For JSON Method:

1. In DevTools Console, run:

```javascript
JSON.stringify(
  document.cookie.split(";").map((cookie) => {
    const [name, value] = cookie.trim().split("=");
    return {
      name: name,
      value: value,
      domain: ".douban.com",
      path: "/",
    };
  }),
);
```

### For Header Method:

1. In DevTools Network tab
2. Make any request to douban.com
3. Find the request and copy the `Cookie` header value

## Priority Order

If both `DOUBAN_COOKIES_JSON` and `DOUBAN_COOKIE_HEADER` are provided, the JSON method takes precedence.

## Logging

The script will log which cookie method is being used:

- "Using JSON cookies from DOUBAN_COOKIES_JSON"
- "Using raw cookie header from DOUBAN_COOKIE_HEADER"
- "No cookies provided - using anonymous access"

## Important Notes

- Cookies help avoid rate limiting and access restrictions
- Some Douban pages may require authentication
- The script includes built-in delays (30-40 seconds) between requests
- Always respect Douban's terms of service and robots.txt
