export async function onRequest({ request, env }) {
    if (request.method !== "POST") {
        return new Response("Method Not Allowed", {
            status: 405,
            headers: {
                Allow: "POST",
            },
        })
    }
    let data;
    try {
        data = await request.json()
    } catch (error) {
        return new Response("Invalid JSON", { status: 400 })
    }
    if (!data.email) {
        return new Response("Email is required", { status: 400 })
    }
    const { id: userId, name: userName } = await env.DB.prepare("SELECT id, name FROM chaperone WHERE email = ?").bind(data.email).first()
    if (!userId) {
        return new Response("If an account with that email exists, a password reset link has been sent.", { status: 201 })
    }

    const token = crypto.randomUUID()
    const expiration = new Date(Date.now() + 3600 * 1000).toISOString()
    await env.DB.prepare("UPDATE chaperone SET password_reset_token = ?, password_reset_expiry = ? WHERE id = ?").bind(token, expiration, userId).run()

    const emailPayload = buildForgotPasswordEmail(userName, data.email, `${env.HOSTNAME}/resetPassword?token=${token}`)

    await env.MAIL_QUEUE.send(emailPayload)
    return new Response("If an account with that email exists, a password reset link has been sent.", { status: 201 })
}


function buildForgotPasswordEmail(userName, userEmail, resetLink) {
    const FORGOT_PASSWORD_TEMPLATE = `
    <p>Hi ${userName},</p>
    <p>A password reset link was requested for your account.</p>
    <p>To reset your password, click on the button below:</p>

    <br />
    <a href="${resetLink}" target="_blank" rel="noopener noreferrer"
    style="background-color: #a80056; color: white; border: none; padding: 10px 20px; text-align: center; text-decoration: none; display: inline-block; font-size: 16px; margin: 4px 2px; cursor: pointer; border-radius: 4px;">
    Reset Password
    </a>
    <br />
    <br />

    <i>
    <p>If you are unable to click the button, you can copy and paste the following link into your browser:</p>
    <p>${resetLink}</p>
    </i>
    <p>If you did not request this, you can safely ignore this email.</p>
    <p>Thank you</p>`

    return {
        to: userEmail,
        subject: "Password Reset Request",
        html: FORGOT_PASSWORD_TEMPLATE,
    }
}