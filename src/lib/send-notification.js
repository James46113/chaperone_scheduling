import { buildPushPayload } from '@block65/webcrypto-web-push'

export default async function sendNotification(env, chaperone_id, title, body, url) {
    try {
        const notification = {
            chaperone_id,
            title,
            body,
            url,
        };
        const { results: subscriptions } = await env.DB.prepare("SELECT * FROM notification_subscription WHERE chaperone_id = ?").bind(chaperone_id).all();

        const vapid = {
            subject: 'mailto:jamescaroe@gmail.com',
            publicKey: env.VAPID_PUBLIC_KEY,
            privateKey: env.VAPID_PRIVATE_KEY,
        }

        await Promise.all(subscriptions.map(async (row) => {
            const subscription = JSON.parse(row.subscription)
            const webpushPayload = await buildPushPayload(
                { data: notification },
                subscription,
                vapid,
            )
            return fetch(subscription.endpoint, webpushPayload)
        }))


    } catch (error) {
        console.error('Failed to send notification to queue:', error);
        throw error;
    }
}