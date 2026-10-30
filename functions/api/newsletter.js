const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(body, init = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init.headers || {})
    }
  });
}

async function subscribeWithMailchimp(email, env) {
  if (!env.MAILCHIMP_API_KEY || !env.MAILCHIMP_AUDIENCE_ID) {
    return {
      configured: false
    };
  }

  const dc = env.MAILCHIMP_SERVER_PREFIX || env.MAILCHIMP_API_KEY.split("-").pop();
  const response = await fetch(
    `https://${dc}.api.mailchimp.com/3.0/lists/${env.MAILCHIMP_AUDIENCE_ID}/members`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`anystring:${env.MAILCHIMP_API_KEY}`)}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        email_address: email,
        status: env.MAILCHIMP_STATUS || "subscribed"
      })
    }
  );

  if (response.ok) {
    return {
      configured: true
    };
  }

  const error = await response.json().catch(() => ({}));
  if (error.title === "Member Exists") {
    return {
      configured: true
    };
  }

  throw new Error(error.detail || "Subscription failed.");
}

export async function onRequestPost({ request, env }) {
  const form = await request.formData();

  if (form.get("_mc4wp_honeypot")) {
    return json({
      message: "Thank you for subscribing."
    });
  }

  const email = String(form.get("EMAIL") || "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return json(
      {
        message: "Please enter a valid email address."
      },
      {
        status: 400
      }
    );
  }

  try {
    if (env.DB) {
      await env.DB.prepare(
        `INSERT OR IGNORE INTO newsletter_subscribers
          (email, created_at, source)
        VALUES (?, datetime('now'), ?)`
      )
        .bind(email, "website")
        .run();

      return json({
        message: "Thank you for subscribing."
      });
    }

    const result = await subscribeWithMailchimp(email, env);
    return json({
      message: result.configured
        ? "Thank you for subscribing."
        : "Newsletter signup is not connected yet."
    });
  } catch (error) {
    return json(
      {
        message: error.message || "Please try again."
      },
      {
        status: 502
      }
    );
  }
}

export function onRequest() {
  return json(
    {
      message: "Method not allowed."
    },
    {
      status: 405,
      headers: {
        allow: "POST"
      }
    }
  );
}
