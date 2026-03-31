import sendNotification from '../src/lib/send-notification.js';

export default {
    async queue(batch, env) {
        for (const message of batch.messages) {
            try {
                const { chaperone_id, title, body, url } = message.body || {};
                console.log('Processing notification:', { chaperone_id, title, body, url });
                if (!chaperone_id || !title || !body || !url) {
                    message.ack();
                    continue;
                }
                if (parseInt(chaperone_id) === -1) {
                    const { results: chaperones } = await env.DB.prepare("SELECT id FROM chaperone").all();
                    await Promise.all(chaperones.map(async (chaperone) => sendNotification(env, chaperone.id, title, body, url)));
                } else {
                    await sendNotification(env, chaperone_id, title, body, url);
                }
                message.ack();
            } catch (error) {
                console.error('Queue notification send failed:', error);
                message.retry();
            }
        }
    },
};
