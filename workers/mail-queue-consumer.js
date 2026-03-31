import sendMail from '../src/lib/send-mail.js';

export default {
    async queue(batch, env) {
        for (const message of batch.messages) {
            try {
                const { to, subject, html } = message.body || {};
                console.log('Processing email:', { to, subject });
                if (!to || !subject || !html) {
                    message.ack();
                    continue;
                }

                await sendMail(env, to, subject, html);
                message.ack();
            } catch (error) {
                console.error('Queue email send failed:', error);
                message.retry();
            }
        }
    },
};
